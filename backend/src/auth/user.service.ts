import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateUserProfileDto, RequestEmailChangeDto, VerifyEmailChangeDto } from './dto/user.dto';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      // @ts-ignore
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        displayName: true,
        language: true,
        website: true,
        facebook: true,
        twitter: true,
        instagram: true,
        linkedin: true,
        youtube: true,
        phoneNumber: true,
        countryCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cast to any to avoid type mismatch with generated client
    const userWithCount = user as any;

    return {
      ...user,
      postsCount: userWithCount._count?.posts || 0,
       // Suppress potential phoneNumber type issue if schema isn't synced
      phoneNumber: userWithCount.phoneNumber,
    };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      // @ts-ignore - Phone number exists in schema but type might lag
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        role: true,
        phoneNumber: true,
        countryCode: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => {
       const u = user as any;
       return {
        ...user,
        postsCount: u._count?.posts || 0,
        displayNameFormatted: this.getFormattedDisplayName(user),
       };
    });
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
        displayName: data.displayName,
        language: data.language,
        website: data.website,
        facebook: data.facebook,
        twitter: data.twitter,
        instagram: data.instagram,
        linkedin: data.linkedin,
        youtube: data.youtube,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
      },
    });
  }

  async updateUserRole(userId: string, role: string) {
    if (!Object.values(Role).includes(role as Role)) {
       throw new BadRequestException(`Invalid role: ${role}`);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });
  }

  async deleteUser(userId: string) {
    // Check if deleting this user would leave no SUPER_ADMIN
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, username: true },
    });

    if (!userToDelete) {
      throw new NotFoundException('User not found');
    }

    if (userToDelete.role === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      });

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last Super Admin account. Please create another Super Admin before deleting this account.'
        );
      }
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // Email change workflow
  async requestEmailChange(userId: string, data: RequestEmailChangeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.newEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Generate 8-digit hexadecimal codes
    const oldEmailCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const newEmailCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create email change request
    const request = await this.prisma.emailChangeRequest.create({
      data: {
        userId,
        oldEmail: user.email,
        newEmail: data.newEmail,
        oldEmailCode,
        newEmailCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await this.mailService.sendEmailChangeVerification(user.email, oldEmailCode, 'OLD');
    await this.mailService.sendEmailChangeVerification(data.newEmail, newEmailCode, 'NEW');

    // For now, return the codes (in production, these should be sent via email)
    return {
      requestId: request.id,
      message: 'Verification codes sent to both email addresses',
      // Remove these in production - only for testing
      oldEmailCode: process.env.NODE_ENV === 'development' ? oldEmailCode : undefined,
      newEmailCode: process.env.NODE_ENV === 'development' ? newEmailCode : undefined,
    };
  }

  async verifyEmailChange(data: VerifyEmailChangeDto) {
    const request = await this.prisma.emailChangeRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found');
    }

    if (new Date() > request.expiresAt) {
      throw new BadRequestException('Verification codes have expired');
    }

    // Verify codes
    const oldEmailValid = request.oldEmailCode === data.oldEmailCode.toUpperCase();
    const newEmailValid = request.newEmailCode === data.newEmailCode.toUpperCase();

    if (!oldEmailValid || !newEmailValid) {
      throw new BadRequestException('Invalid verification codes');
    }

    // Mark as verified
    await this.prisma.emailChangeRequest.update({
      where: { id: data.requestId },
      data: {
        oldEmailVerified: true,
        newEmailVerified: true,
      },
    });

    return {
      message: 'Email addresses verified. Waiting for admin approval.',
      requestId: request.id,
    };
  }

  async approveEmailChange(requestId: string) {
    const request = await this.prisma.emailChangeRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found');
    }

    if (!request.oldEmailVerified || !request.newEmailVerified) {
      throw new BadRequestException('Email addresses not verified yet');
    }

    if (request.adminApproved) {
      throw new BadRequestException('Request already approved');
    }

    // Update user email and mark request as approved
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: request.userId },
        data: { email: request.newEmail },
      }),
      this.prisma.emailChangeRequest.update({
        where: { id: requestId },
        data: {
          adminApproved: true,
          completedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Email change approved and completed',
    };
  }

  async getPendingEmailChangeRequests() {
    return this.prisma.emailChangeRequest.findMany({
      where: {
        oldEmailVerified: true,
        newEmailVerified: true,
        adminApproved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private getFormattedDisplayName(user: any): string {
    const displayType = user.displayName || 'username';
    
    switch (displayType) {
      case 'firstName':
        return user.firstName || user.username;
      case 'lastName':
        return user.lastName || user.username;
      case 'nickname':
        return user.nickname || user.username;
      case 'email':
        return user.email;
      default:
        return user.username;
    }
  }
}
