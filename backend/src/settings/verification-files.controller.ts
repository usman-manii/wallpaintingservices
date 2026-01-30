// backend/src/settings/verification-files.controller.ts
import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { SettingsService } from './settings.service';

/**
 * Controller for serving verification files at root level
 * Example: GET /google123.html -> serves verification file
 */
@Controller()
export class VerificationFilesController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  // Only match files that include an extension at the root.
  // This avoids shadowing real routes like /pages or /health.
  @Get(':filename.:ext')
  async serveFile(
    @Param('filename') filename: string,
    @Param('ext') ext: string,
    @Res() res: Response,
  ) {
    // Only serve files that look like verification files
    const validExtensions = new Set(['html', 'txt', 'json', 'xml']);
    const normalizedExt = (ext || '').toLowerCase();

    if (!validExtensions.has(normalizedExt)) {
      return res.status(HttpStatus.NOT_FOUND).send('Not Found');
    }

    try {
      const fullFilename = `${filename}.${normalizedExt}`;
      const result = await this.settingsService.serveVerificationFile(fullFilename);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(result.content);
    } catch (error) {
      // Return 404 if file not found
      res.status(HttpStatus.NOT_FOUND).send('Not Found');
    }
  }
}
