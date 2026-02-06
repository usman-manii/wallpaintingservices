import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.mediaService.uploadFile(file, userId, folder || 'uploads');
  }

  @Post('upload-from-url')
  async uploadFromUrl(
    @Body('url') url: string,
    @Body('folder') folder: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.mediaService.uploadFromUrl(url, userId, folder || 'uploads');
  }

  @Get()
  async listMedia(
    @Request() req: AuthenticatedRequest,
    @Query('folder') folder?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // For admin panel, use higher default limit to show more files
    const limitValue = Math.min(Math.max(parseInt(limit || '100', 10), 1), 200);
    return this.mediaService.listMedia(
      req.user.id || req.user.userId,
      req.user.role,
      folder,
      parseInt(page || '1', 10),
      limitValue,
    );
  }

  @Get(':id')
  async getMedia(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.mediaService.getMedia(id, req.user.id || req.user.userId, req.user.role);
  }

  @Patch(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() data: { title?: string; description?: string; altText?: string; tags?: string[] },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.mediaService.updateMedia(id, data, req.user.id || req.user.userId, req.user.role);
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.mediaService.deleteMedia(id, req.user.id || req.user.userId, req.user.role);
  }
}
