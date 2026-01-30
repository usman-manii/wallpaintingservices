import { Injectable } from '@nestjs/common';
import { OpenAiProvider } from './providers/openai.provider';

interface BlogGenerationOptions {
  minWords?: number;
  maxWords?: number;
  tone?: string;
  keywords?: string[];
}

interface BlogGenerationResult {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  seoTitle: string;
  keywords: string[];
  tags: string[];
}

@Injectable()
export class AiService {
  constructor(private provider: OpenAiProvider) {}

  async generatePost(topic: string) {
    return this.provider.generatePost(topic);
  }

  async optimizeSeo(content: string) {
    return this.provider.optimizeSeo(content);
  }

  /**
   * Generate a comprehensive blog post with full SEO optimization
   */
  async generateBlogPost(prompt: string, options: BlogGenerationOptions): Promise<BlogGenerationResult> {
    try {
      const result = await this.provider.generateBlogPost(prompt, options);
      
      // Validate the result has all required fields
      if (!result.title || !result.content) {
        throw new Error('AI did not return valid blog post structure');
      }

      return result;
    } catch (error) {
      throw new Error(`Blog generation failed: ${error.message}`);
    }
  }
}
