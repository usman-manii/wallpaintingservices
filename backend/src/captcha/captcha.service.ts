import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly encryptionKey: Buffer;
  private readonly IV_LENGTH = 12;

  constructor(
    private settingsService: SettingsService,
    private httpService: HttpService
  ) {
    const appSecret = process.env.APP_SECRET;
    if (!appSecret) {
      throw new Error('APP_SECRET is required for CAPTCHA encryption');
    }
    this.encryptionKey = crypto.createHash('sha256').update(appSecret).digest();
  }

  async verify(token: string, ip?: string, captchaId?: string, type?: string): Promise<boolean> {
     const settings = await this.settingsService.getSettings();
     // Use provided type or fallback to default configured
     const activeType = type || settings.captchaType || 'recaptcha-v2';

     this.logger.debug(`Verifying captcha type: ${activeType}`);

     if (activeType === 'custom') {
         if (!captchaId) {
             this.logger.warn('Captcha ID missing for custom captcha');
             return false;
         }
         return this.verifyCustom(token, captchaId);
     } else if (activeType === 'recaptcha-v3') {
         const secret = settings.recaptchaV3SecretKey;
         if (!secret) {
             this.logger.warn('Recaptcha V3 secret not configured, checking V2 as fallback...');
             // If V3 key is missing but client sent V3 type (unlikely config), try V2? 
             // No, client sends specific token. We can't validate V3 token with V2 secret.
             // But we can check if we should ALLOW it if secret is missing (dev mode?)
             // Better to fail safe.
             return false; 
         }
         return this.verifyGoogleRecaptcha(token, secret, 0.5, ip);
     } else {
         // v2
         // Support recaptchaSecretKey or recaptchaV2SecretKey
         const secret = settings.recaptchaV2SecretKey || settings.recaptchaSecretKey;
         if (!secret) {
            this.logger.warn('Recaptcha V2 secret not configured.');
            return false;
         }
         return this.verifyGoogleRecaptcha(token, secret, undefined, ip);
     }
  }

  async generateChallenge() {
    // 1. Generate random 4 character alphanumeric string
    // Use crypto for better randomness and guaranteed length
    const text = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    // 2. Create SVG
    const svg = this.generateSvg(text);
    
    // 3. Encrypt the text + timestamp to create unique ID
    const payload = JSON.stringify({ text, ts: Date.now() });
    const id = this.encrypt(payload);

    return {
      image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      captchaId: id
    };
  }

  private async verifyCustom(input: string, captchaId: string): Promise<boolean> {
     try {
       const decrypted = this.decrypt(captchaId);
       const { text, ts } = JSON.parse(decrypted);

       // EXPIRATION: 5 minutes
       if (Date.now() - ts > 5 * 60 * 1000) {
           return false;
       }
       
       return input.toUpperCase() === text;
     } catch (e) {
       this.logger.error('Failed to verify custom captcha', e);
       return false;
     }
  }

  private async verifyGoogleRecaptcha(token: string, secret: string, threshold = 0.5, ip?: string): Promise<boolean> {
      try {
        const remoteip = ip ? `&remoteip=${encodeURIComponent(ip)}` : '';
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}${remoteip}`;
        const { data } = await lastValueFrom(this.httpService.post(url));
        
        if (!data.success) {
            this.logger.warn('Google Recaptcha Failed', data);
            return false;
        }
        
        if (data.score !== undefined && data.score < threshold) {
            this.logger.warn(`Google Recaptcha V3 Score too low: ${data.score}`);
            return false;
        }

        return true;
      } catch (e) {
        this.logger.error('Google Recaptcha Verification Error', e); 
        return false;
      }
  }

  private generateSvg(text: string): string {
    const width = 200;
    const height = 60;
    // Add noise lines
    let noise = '';
    for(let i=0; i<10; i++) {
        noise += `<line x1="${Math.random()*width}" y1="${Math.random()*height}" x2="${Math.random()*width}" y2="${Math.random()*height}" stroke="#ccc" />`;
    }
    
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f9f9f9"/>
      ${noise}
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="30" fill="#333" letter-spacing="5">${text.split('').join(' ')}</text>
    </svg>`;
  }

  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (e) {
      this.logger.error('Error generating CAPTCHA', e);
      throw e;
    }
  }

  private decrypt(text: string): string {
    try {
      const [ivHex, tagHex, encryptedHex] = text.split(':');
      if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error('Invalid encrypted payload');
      }
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const encryptedText = Buffer.from(encryptedHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (e) {
      throw new Error('Decryption Failed');
    }
  }
}
