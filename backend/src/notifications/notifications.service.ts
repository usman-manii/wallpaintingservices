import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationAudience,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  Role,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';

const MAX_PAGE_SIZE = 100;

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private parseDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private parseRoles(value: unknown): Role[] {
    const roles = this.normalizeStringArray(value) as Role[];
    const roleValues = new Set(Object.values(Role));
    return roles.filter((role) => roleValues.has(role));
  }

  private parseChannels(value: unknown): NotificationChannel[] {
    const channels = this.normalizeStringArray(value) as NotificationChannel[];
    const channelValues = new Set(Object.values(NotificationChannel));
    return channels.filter((channel) => channelValues.has(channel));
  }

  private parseEnum<T extends string>(value: unknown, enumValues: T[]): T | null {
    if (typeof value === 'string' && enumValues.includes(value as T)) {
      return value as T;
    }
    return null;
  }

  private normalizeBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return fallback;
  }

  private async getNotificationConfig() {
    const settings = await this.prisma.siteSettings.findFirst({
      select: { notificationConfig: true },
    });
    const config = (settings?.notificationConfig ?? {}) as Record<string, unknown>;
    return {
      inAppEnabled: typeof config.inAppEnabled === 'boolean' ? config.inAppEnabled : true,
      emailEnabled: typeof config.emailEnabled === 'boolean' ? config.emailEnabled : true,
      browserEnabled: typeof config.browserEnabled === 'boolean' ? config.browserEnabled : false,
      requireBrowserOptIn: typeof config.requireBrowserOptIn === 'boolean' ? config.requireBrowserOptIn : true,
    };
  }

  private arraysEqual<T>(a: T[], b: T[]) {
    if (a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((value, index) => value === bSorted[index]);
  }

  private ensureAudienceTargets(audience: NotificationAudience, roles: Role[], users: string[]) {
    if (audience === NotificationAudience.ROLE && roles.length === 0) {
      throw new BadRequestException('Target roles are required for role-based notifications');
    }
    if (audience === NotificationAudience.USER && users.length === 0) {
      throw new BadRequestException('Target users are required for user-specific notifications');
    }
  }

  private async resolveAudienceUserIds(notification: {
    audience: NotificationAudience;
    targetRoles: Role[];
    targetUserIds: string[];
  }) {
    if (notification.audience === NotificationAudience.ALL) {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      return users.map((user) => user.id);
    }
    if (notification.audience === NotificationAudience.ROLE) {
      if (!notification.targetRoles.length) return [];
      const users = await this.prisma.user.findMany({
        where: { role: { in: notification.targetRoles } },
        select: { id: true },
      });
      return users.map((user) => user.id);
    }
    return Array.from(new Set(notification.targetUserIds));
  }

  private async dispatchNotification(notification: {
    id: string;
    audience: NotificationAudience;
    targetRoles: Role[];
    targetUserIds: string[];
    channels?: NotificationChannel[];
  }) {
    const userIds = await this.resolveAudienceUserIds(notification);
    if (!userIds.length) return 0;

    const now = new Date();
    await this.prisma.notificationRecipient.createMany({
      data: userIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        deliveredAt: now,
      })),
      skipDuplicates: true,
    });

    const channels = notification.channels && notification.channels.length > 0
      ? notification.channels
      : [NotificationChannel.IN_APP];

    if (channels.includes(NotificationChannel.EMAIL)) {
      await this.sendEmailNotifications(notification.id, userIds);
    }

    return userIds.length;
  }

  private async sendEmailNotifications(notificationId: string, userIds: string[]) {
    const [notification, users] = await Promise.all([
      this.prisma.notification.findUnique({
        where: { id: notificationId },
        select: {
          title: true,
          message: true,
          actionLabel: true,
          actionUrl: true,
          category: true,
          priority: true,
        },
      }),
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, firstName: true, displayName: true, username: true },
      }),
    ]);

    if (!notification) return;

    const settings = await this.prisma.siteSettings.findFirst({
      select: { notificationConfig: true },
    });

    const config = (settings?.notificationConfig ?? {}) as Record<string, unknown>;
    const emailEnabled = typeof config.emailEnabled === 'boolean' ? config.emailEnabled : true;
    if (!emailEnabled) return;

    for (const user of users) {
      const name = user.firstName || user.displayName || user.username || undefined;
      try {
        await this.mailService.sendNotificationEmail(user.email, {
          title: notification.title,
          message: notification.message,
          actionLabel: notification.actionLabel || undefined,
          actionUrl: notification.actionUrl || undefined,
          category: notification.category,
          priority: notification.priority,
        }, name);
      } catch (_) {
        // Do not block other deliveries on email failures
      }
    }
  }

  private async syncScheduledNotifications() {
    const now = new Date();
    const due = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.SCHEDULED,
        sendAt: { lte: now },
      },
    });

    if (!due.length) return;

    for (const notification of due) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT },
      });
      await this.dispatchNotification(notification);
    }
  }

  async getAdminStats() {
    await this.syncScheduledNotifications();
    const [total, draft, scheduled, sent, archived] = await this.prisma.$transaction([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { status: NotificationStatus.DRAFT } }),
      this.prisma.notification.count({ where: { status: NotificationStatus.SCHEDULED } }),
      this.prisma.notification.count({ where: { status: NotificationStatus.SENT } }),
      this.prisma.notification.count({ where: { status: NotificationStatus.ARCHIVED } }),
    ]);

    return { total, draft, scheduled, sent, archived };
  }

  async getAdminNotifications(query: Record<string, unknown>) {
    await this.syncScheduledNotifications();
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, toNumber(query.limit, 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    const status = this.parseEnum(query.status, Object.values(NotificationStatus));
    const category = this.parseEnum(query.category, Object.values(NotificationCategory));
    const type = this.parseEnum(query.type, Object.values(NotificationType));
    const priority = this.parseEnum(query.priority, Object.values(NotificationPriority));
    const audience = this.parseEnum(query.audience, Object.values(NotificationAudience));
    const channel = this.parseEnum(query.channel, Object.values(NotificationChannel));

    if (status) where.status = status;
    if (category) where.category = category;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (audience) where.audience = audience;
    if (channel) where.channels = { has: channel };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, email: true, username: true, displayName: true },
          },
          _count: { select: { recipients: true } },
        },
      }),
    ]);

    const ids = notifications.map((notification) => notification.id);
    const unreadCounts = ids.length
      ? await this.prisma.notificationRecipient.groupBy({
          by: ['notificationId'],
          where: {
            notificationId: { in: ids },
            readAt: null,
            dismissedAt: null,
          },
          _count: { _all: true },
        })
      : [];

    const unreadMap = new Map(
      unreadCounts.map((item) => [item.notificationId, item._count._all]),
    );

    const data = notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      type: notification.type,
      priority: notification.priority,
      status: notification.status,
      audience: notification.audience,
      channels: notification.channels,
      targetRoles: notification.targetRoles,
      targetUserIds: notification.targetUserIds,
      actionLabel: notification.actionLabel,
      actionUrl: notification.actionUrl,
      isSticky: notification.isSticky,
      sendAt: notification.sendAt,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      createdBy: notification.createdBy,
      recipientCount: notification._count.recipients,
      unreadCount: unreadMap.get(notification.id) || 0,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createNotification(payload: unknown, createdById: string) {
    if (!isRecord(payload)) {
      throw new BadRequestException('Invalid notification payload');
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!title) throw new BadRequestException('Title is required');
    if (!message) throw new BadRequestException('Message is required');

    const type =
      this.parseEnum(payload.type, Object.values(NotificationType)) ||
      NotificationType.INFO;
    const priority =
      this.parseEnum(payload.priority, Object.values(NotificationPriority)) ||
      NotificationPriority.NORMAL;
    const audience =
      this.parseEnum(payload.audience, Object.values(NotificationAudience)) ||
      NotificationAudience.ALL;

    const targetRoles = this.parseRoles(payload.targetRoles);
    const targetUserIds = this.normalizeStringArray(payload.targetUserIds);
    this.ensureAudienceTargets(audience, targetRoles, targetUserIds);

    const sendAt = this.parseDate(payload.sendAt);
    const expiresAt = this.parseDate(payload.expiresAt);

    if (sendAt && expiresAt && expiresAt <= sendAt) {
      throw new BadRequestException('Expires at must be after send time');
    }

    let status =
      this.parseEnum(payload.status, Object.values(NotificationStatus)) ||
      NotificationStatus.DRAFT;

    const now = new Date();
    if (sendAt && status === NotificationStatus.DRAFT) {
      status = NotificationStatus.SCHEDULED;
    }
    if (status === NotificationStatus.SCHEDULED && !sendAt) {
      throw new BadRequestException('Schedule time is required for scheduled notifications');
    }
    if (status === NotificationStatus.SENT && sendAt && sendAt > now) {
      status = NotificationStatus.SCHEDULED;
    }

    const notification = await this.prisma.notification.create({
      data: {
        title,
        message,
        category: this.parseEnum(payload.category, Object.values(NotificationCategory)) || NotificationCategory.ALERT,
        type,
        priority,
        status,
        audience,
        channels: this.parseChannels(payload.channels).length > 0
          ? this.parseChannels(payload.channels)
          : [NotificationChannel.IN_APP],
        targetRoles,
        targetUserIds,
        actionLabel: typeof payload.actionLabel === 'string' ? payload.actionLabel.trim() : undefined,
        actionUrl: typeof payload.actionUrl === 'string' ? payload.actionUrl.trim() : undefined,
        isSticky: this.normalizeBoolean(payload.isSticky),
        sendAt,
        expiresAt,
        createdById,
      },
    });

    if (notification.status === NotificationStatus.SENT && (!notification.sendAt || notification.sendAt <= now)) {
      await this.dispatchNotification(notification);
    }

    return notification;
  }

  async updateNotification(id: string, payload: unknown) {
    if (!isRecord(payload)) {
      throw new BadRequestException('Invalid notification payload');
    }

    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');

    const title = Object.prototype.hasOwnProperty.call(payload, 'title')
      ? typeof payload.title === 'string' ? payload.title.trim() : ''
      : existing.title;
    const message = Object.prototype.hasOwnProperty.call(payload, 'message')
      ? typeof payload.message === 'string' ? payload.message.trim() : ''
      : existing.message;

    if (!title) throw new BadRequestException('Title is required');
    if (!message) throw new BadRequestException('Message is required');

    const type =
      this.parseEnum(payload.type, Object.values(NotificationType)) ||
      existing.type;
    const priority =
      this.parseEnum(payload.priority, Object.values(NotificationPriority)) ||
      existing.priority;
    const audience =
      this.parseEnum(payload.audience, Object.values(NotificationAudience)) ||
      existing.audience;

    const targetRoles = Object.prototype.hasOwnProperty.call(payload, 'targetRoles')
      ? this.parseRoles(payload.targetRoles)
      : existing.targetRoles;
    const targetUserIds = Object.prototype.hasOwnProperty.call(payload, 'targetUserIds')
      ? this.normalizeStringArray(payload.targetUserIds)
      : existing.targetUserIds;

    this.ensureAudienceTargets(audience, targetRoles, targetUserIds);

    const sendAt = Object.prototype.hasOwnProperty.call(payload, 'sendAt')
      ? this.parseDate(payload.sendAt)
      : existing.sendAt;
    const expiresAt = Object.prototype.hasOwnProperty.call(payload, 'expiresAt')
      ? this.parseDate(payload.expiresAt)
      : existing.expiresAt;

    if (sendAt && expiresAt && expiresAt <= sendAt) {
      throw new BadRequestException('Expires at must be after send time');
    }

    let status =
      this.parseEnum(payload.status, Object.values(NotificationStatus)) ||
      existing.status;

    const now = new Date();
    if (sendAt && status === NotificationStatus.DRAFT) {
      status = NotificationStatus.SCHEDULED;
    }
    if (status === NotificationStatus.SCHEDULED && !sendAt) {
      throw new BadRequestException('Schedule time is required for scheduled notifications');
    }
    if (status === NotificationStatus.SENT && sendAt && sendAt > now) {
      status = NotificationStatus.SCHEDULED;
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        title,
        message,
        category: Object.prototype.hasOwnProperty.call(payload, 'category')
          ? this.parseEnum(payload.category, Object.values(NotificationCategory)) || existing.category
          : existing.category,
        type,
        priority,
        status,
        audience,
        channels: Object.prototype.hasOwnProperty.call(payload, 'channels')
          ? (this.parseChannels(payload.channels).length > 0 ? this.parseChannels(payload.channels) : existing.channels)
          : existing.channels,
        targetRoles,
        targetUserIds,
        actionLabel: Object.prototype.hasOwnProperty.call(payload, 'actionLabel')
          ? (typeof payload.actionLabel === 'string' ? payload.actionLabel.trim() : null)
          : existing.actionLabel,
        actionUrl: Object.prototype.hasOwnProperty.call(payload, 'actionUrl')
          ? (typeof payload.actionUrl === 'string' ? payload.actionUrl.trim() : null)
          : existing.actionUrl,
        isSticky: Object.prototype.hasOwnProperty.call(payload, 'isSticky')
          ? this.normalizeBoolean(payload.isSticky)
          : existing.isSticky,
        sendAt,
        expiresAt,
      },
    });

    const audienceChanged =
      existing.audience !== audience ||
      !this.arraysEqual(existing.targetRoles, targetRoles) ||
      !this.arraysEqual(existing.targetUserIds, targetUserIds);

    if (
      notification.status === NotificationStatus.SENT &&
      (existing.status !== NotificationStatus.SENT || !existing.sendAt || existing.sendAt > now || audienceChanged)
    ) {
      await this.dispatchNotification(notification);
    }

    return notification;
  }

  async publishNotification(id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');

    const now = new Date();
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sendAt: existing.sendAt && existing.sendAt > now ? now : existing.sendAt || now,
      },
    });

    await this.dispatchNotification(updated);
    return updated;
  }

  async archiveNotification(id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.ARCHIVED },
    });
  }

  async deleteNotification(id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  private isNotificationActive(notification: {
    status: NotificationStatus;
    sendAt: Date | null;
    expiresAt: Date | null;
  }) {
    if (notification.status !== NotificationStatus.SENT) return false;
    const now = new Date();
    if (notification.sendAt && notification.sendAt > now) return false;
    if (notification.expiresAt && notification.expiresAt <= now) return false;
    return true;
  }

  private canUserAccess(notification: {
    audience: NotificationAudience;
    targetRoles: Role[];
    targetUserIds: string[];
  }, userId: string, role: string) {
    if (notification.audience === NotificationAudience.ALL) return true;
    if (notification.audience === NotificationAudience.ROLE) {
      return notification.targetRoles.includes(role as Role);
    }
    if (notification.audience === NotificationAudience.USER) {
      return notification.targetUserIds.includes(userId);
    }
    return false;
  }

  async getUserNotifications(userId: string, role: string, query: Record<string, unknown>) {
    await this.syncScheduledNotifications();
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, toNumber(query.limit, 10)));
    const skip = (page - 1) * limit;

    const notificationConfig = await this.getNotificationConfig();
    if (!notificationConfig.inAppEnabled) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    }

    const unreadOnly = this.normalizeBoolean(query.unreadOnly, false);
    const includeDismissed = this.normalizeBoolean(query.includeDismissed, false);

    const baseWhere: Record<string, unknown> = {
      status: NotificationStatus.SENT,
      channels: { has: NotificationChannel.IN_APP },
      AND: [
        { OR: [{ sendAt: null }, { sendAt: { lte: new Date() } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
      OR: [
        { audience: NotificationAudience.ALL },
        { audience: NotificationAudience.ROLE, targetRoles: { has: role as Role } },
        { audience: NotificationAudience.USER, targetUserIds: { has: userId } },
      ],
    };

    if (!includeDismissed || unreadOnly) {
      const recipientConditions = [] as Record<string, unknown>[];
      if (!includeDismissed) {
        recipientConditions.push({ recipients: { some: { userId, dismissedAt: null } } });
      }
      if (unreadOnly) {
        recipientConditions.push({ recipients: { some: { userId, readAt: null, dismissedAt: null } } });
      }
      recipientConditions.push({ recipients: { none: { userId } } });
      baseWhere.AND = [...(baseWhere.AND as Record<string, unknown>[]), { OR: recipientConditions }];
    }

    const [total, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: baseWhere }),
      this.prisma.notification.findMany({
        where: baseWhere,
        orderBy: [
          { isSticky: 'desc' },
          { sendAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          recipients: {
            where: { userId },
            select: {
              readAt: true,
              dismissedAt: true,
              archivedAt: true,
              deliveredAt: true,
            },
          },
        },
      }),
    ]);

    const missingIds = notifications
      .filter((notification) => notification.recipients.length === 0)
      .map((notification) => notification.id);

    if (missingIds.length) {
      const now = new Date();
      await this.prisma.notificationRecipient.createMany({
        data: missingIds.map((notificationId) => ({
          notificationId,
          userId,
          deliveredAt: now,
        })),
        skipDuplicates: true,
      });
    }

    const data = notifications.map((notification) => {
      const recipient = notification.recipients[0];
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        audience: notification.audience,
        channels: notification.channels,
        actionLabel: notification.actionLabel,
        actionUrl: notification.actionUrl,
        isSticky: notification.isSticky,
        sendAt: notification.sendAt,
        expiresAt: notification.expiresAt,
        createdAt: notification.createdAt,
        readAt: recipient?.readAt ?? null,
        dismissedAt: recipient?.dismissedAt ?? null,
        deliveredAt: recipient?.deliveredAt ?? null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getUnreadCount(userId: string, role: string) {
    await this.syncScheduledNotifications();
    const notificationConfig = await this.getNotificationConfig();
    if (!notificationConfig.inAppEnabled) {
      return { unread: 0 };
    }
    const count = await this.prisma.notification.count({
      where: {
        status: NotificationStatus.SENT,
        channels: { has: NotificationChannel.IN_APP },
        AND: [
          { OR: [{ sendAt: null }, { sendAt: { lte: new Date() } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          {
            OR: [
              { recipients: { some: { userId, readAt: null, dismissedAt: null } } },
              { recipients: { none: { userId } } },
            ],
          },
        ],
        OR: [
          { audience: NotificationAudience.ALL },
          { audience: NotificationAudience.ROLE, targetRoles: { has: role as Role } },
          { audience: NotificationAudience.USER, targetUserIds: { has: userId } },
        ],
      },
    });

    return { unread: count };
  }

  async markRead(userId: string, role: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (!this.isNotificationActive(notification)) {
      throw new BadRequestException('Notification is not active');
    }
    if (!this.canUserAccess(notification, userId, role)) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    const now = new Date();
    await this.prisma.notificationRecipient.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: { readAt: now, dismissedAt: null },
      create: {
        notificationId,
        userId,
        readAt: now,
        deliveredAt: now,
      },
    });

    return { success: true };
  }

  async dismiss(userId: string, role: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (!this.isNotificationActive(notification)) {
      throw new BadRequestException('Notification is not active');
    }
    if (!this.canUserAccess(notification, userId, role)) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    const now = new Date();
    await this.prisma.notificationRecipient.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: { dismissedAt: now },
      create: {
        notificationId,
        userId,
        dismissedAt: now,
        deliveredAt: now,
      },
    });

    return { success: true };
  }

  async markAllRead(userId: string, role: string) {
    const now = new Date();
    const notifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.SENT,
        AND: [
          { OR: [{ sendAt: null }, { sendAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
        OR: [
          { audience: NotificationAudience.ALL },
          { audience: NotificationAudience.ROLE, targetRoles: { has: role as Role } },
          { audience: NotificationAudience.USER, targetUserIds: { has: userId } },
        ],
      },
      select: { id: true },
    });

    const ids = notifications.map((notification) => notification.id);
    if (!ids.length) {
      return { updated: 0 };
    }

    await this.prisma.notificationRecipient.updateMany({
      where: {
        userId,
        notificationId: { in: ids },
        readAt: null,
      },
      data: { readAt: now },
    });

    const existingRecipients = await this.prisma.notificationRecipient.findMany({
      where: { userId, notificationId: { in: ids } },
      select: { notificationId: true },
    });
    const existingIds = new Set(existingRecipients.map((recipient) => recipient.notificationId));
    const missing = ids.filter((id) => !existingIds.has(id));

    if (missing.length) {
      await this.prisma.notificationRecipient.createMany({
        data: missing.map((notificationId) => ({
          notificationId,
          userId,
          deliveredAt: now,
          readAt: now,
        })),
        skipDuplicates: true,
      });
    }

    return { updated: ids.length };
  }
}
