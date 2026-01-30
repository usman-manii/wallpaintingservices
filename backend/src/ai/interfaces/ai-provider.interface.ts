
export interface AiProvider {
  generatePost(topic: string): Promise<GeneratedPostContent>;
  optimizeSeo(content: string): Promise<SeoOptimizationResult>;
}

export interface GeneratedPostContent {
  title: string;
  content: string; // HTML
  summary: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface SeoOptimizationResult {
  score: number;
  suggestions: string[];
}
