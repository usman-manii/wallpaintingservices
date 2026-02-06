import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import * as net from 'net';
import { resolve4, resolve6 } from 'dns/promises';
import { Readable } from 'stream';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

/**
 * Media Service\n * Handles file uploads, image processing, and media library management\n * Supports image optimization, variants generation, and folder organization\n */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads');
  private readonly publicDir = path.resolve(this.uploadDir, '..');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    folder: string = 'uploads',
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Generate unique filename
    const { folder: safeFolder, folderPath } = this.getSafeFolder(folder);
    const fileExt = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExt}`;
    const filePath = path.join(folderPath, filename);

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Process image with sharp (optimize and create variants)
    let width: number | undefined;
    let height: number | undefined;
    const variants: Record<string, string> = {};

    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      // Save original
      await image.toFile(filePath);

      // Create thumbnail (300px wide)
      const thumbnailPath = path.join(folderPath, `thumb-${filename}`);
      await sharp(file.buffer)
        .resize(300, null, { withoutEnlargement: true })
        .toFile(thumbnailPath);
      variants.thumbnail = `/uploads/${safeFolder}/thumb-${filename}`;

      // Create medium size (800px wide)
      const mediumPath = path.join(folderPath, `medium-${filename}`);
      await sharp(file.buffer)
        .resize(800, null, { withoutEnlargement: true })
        .toFile(mediumPath);
      variants.medium = `/uploads/${safeFolder}/medium-${filename}`;

      // Create large size (1200px wide)
      const largePath = path.join(folderPath, `large-${filename}`);
      await sharp(file.buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .toFile(largePath);
      variants.large = `/uploads/${safeFolder}/large-${filename}`;
    } catch (error) {
      // If sharp fails, just save the original file
      fs.writeFileSync(filePath, file.buffer);
    }

    // Save to database
    const media = await this.prisma.media.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${safeFolder}/${filename}`,
        path: filePath,
        width,
        height,
        folder: safeFolder,
        uploadedById: userId,
        isOptimized: true,
        variants,
      },
    });

    return media;
  }

  async uploadFromUrl(url: string, userId: string, folder: string = 'uploads') {
    // SECURITY FIX (P1): SSRF Protection - validate URL and block internal IPs
    try {
      // Validate URL format
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new BadRequestException('Only HTTP/HTTPS protocols are allowed');
      }
      
      // Block private/internal IP ranges (SSRF protection)
      await this.assertPublicHost(urlObj.hostname);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, {
        redirect: 'manual', // Don't follow redirects automatically
        headers: {
          'User-Agent': 'WallPaintingServices-MediaUploader/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      // Block redirects to prevent bypassing IP checks
      if (response.status >= 300 && response.status < 400) {
        throw new BadRequestException('Redirects are not allowed');
      }
      
      if (!response.ok) {
        throw new BadRequestException('Failed to fetch image from URL');
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > this.maxFileSize) {
        throw new BadRequestException('Remote file exceeds 10MB limit');
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > this.maxFileSize) {
        throw new BadRequestException('Remote file exceeds 10MB limit');
      }

      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();
      
      if (!contentType || !this.allowedMimeTypes.includes(contentType)) {
        throw new BadRequestException('Invalid image type from URL');
      }

      // Determine file extension from content type
      const extMap: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
      };

      const fileExt = extMap[contentType] || '.jpg';
      const originalName = url.split('/').pop() || `image${fileExt}`;

      // Create a mock Multer file object
      const mockFile: Express.Multer.File = {
        buffer,
        originalname: originalName,
        mimetype: contentType,
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from(buffer),
      };

      return this.uploadFile(mockFile, userId, folder);
    } catch (error) {
      throw new BadRequestException(`Failed to upload from URL: ${error.message}`);
    }
  }

  async getMedia(id: string, userId: string, role?: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    this.assertCanAccess(media, userId, role);
    return media;
  }

  async listMedia(userId: string, role: string | undefined, folder?: string, page = 1, limit = 20) {
    const where: Parameters<typeof this.prisma.media.findMany>[0]['where'] = {};
    if (!this.isAdminRole(role)) {
      where.uploadedById = userId;
    }
    if (folder) where.folder = folder;

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateMedia(
    id: string,
    data: { title?: string; description?: string; altText?: string; tags?: string[] },
    userId: string,
    role?: string,
  ) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    this.assertCanAccess(media, userId, role);
    return this.prisma.media.update({
      where: { id },
      data,
    });
  }

  async deleteMedia(id: string, userId: string, role?: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    this.assertCanAccess(media, userId, role);

    // Delete file from filesystem
    try {
      if (fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }

      // Delete variants
      if (isRecord(media.variants)) {
        Object.values(media.variants).forEach((variantUrl) => {
          if (typeof variantUrl !== 'string') return;
          const relative = variantUrl.replace(/^\/+/, '');
          const variantPath = path.resolve(this.publicDir, relative);
          if (variantPath.startsWith(this.publicDir + path.sep) && fs.existsSync(variantPath)) {
            fs.unlinkSync(variantPath);
          }
        });
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id },
    });

    return { message: 'Media deleted successfully' };
  }

  private getSafeFolder(folder?: string): { folder: string; folderPath: string } {
    const input = (folder || 'uploads').trim();
    const normalized = input.replace(/\\/g, '/');
    const cleaned = normalized.split('/').filter(Boolean).join('/');
    const safeFolder = cleaned || 'uploads';

    if (safeFolder.includes('..') || safeFolder.startsWith('/') || safeFolder.startsWith('\\')) {
      throw new BadRequestException('Invalid folder path');
    }
    if (!/^[a-zA-Z0-9/_-]+$/.test(safeFolder)) {
      throw new BadRequestException('Invalid folder name');
    }

    const baseDir = path.resolve(this.uploadDir);
    const folderPath = path.resolve(this.uploadDir, safeFolder);
    if (!folderPath.startsWith(baseDir + path.sep) && folderPath !== baseDir) {
      throw new BadRequestException('Invalid folder path');
    }

    return { folder: safeFolder, folderPath };
  }

  private isAdminRole(role?: string): boolean {
    return role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN';
  }

  private assertCanAccess(media: { uploadedById: string }, userId: string, role?: string) {
    if (this.isAdminRole(role)) {
      return;
    }
    if (media.uploadedById !== userId) {
      throw new ForbiddenException('You do not have access to this media item');
    }
  }

  private async assertPublicHost(hostname: string): Promise<void> {
    const lower = hostname.toLowerCase();
    const blockedHosts = new Set([
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '::ffff:127.0.0.1',
    ]);

    if (blockedHosts.has(lower)) {
      throw new BadRequestException('Cannot fetch from internal/private hosts');
    }

    const ipType = net.isIP(hostname);
    const addresses = ipType ? [hostname] : await this.resolveHostAddresses(hostname);

    if (addresses.length === 0) {
      throw new BadRequestException('Unable to resolve remote host');
    }

    for (const address of addresses) {
      if (this.isPrivateIp(address)) {
        throw new BadRequestException('Cannot fetch from internal/private IPs');
      }
    }
  }

  private async resolveHostAddresses(hostname: string): Promise<string[]> {
    const results = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
    const addresses: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        addresses.push(...result.value);
      }
    }
    return addresses;
  }

  private isPrivateIp(ip: string): boolean {
    const ipType = net.isIP(ip);
    if (ipType === 4) {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
        return true;
      }
      const [a, b] = parts;

      if (a === 10 || a === 127 || a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      return false;
    }

    if (ipType === 6) {
      const normalized = ip.toLowerCase();
      if (normalized === '::1') return true;
      if (normalized.startsWith('fe80')) return true; // link-local
      if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
      if (normalized.startsWith('::ffff:')) {
        const v4 = normalized.replace('::ffff:', '');
        return this.isPrivateIp(v4);
      }
      return false;
    }

    return true;
  }
}
