
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, GeneratedPostContent, SeoOptimizationResult } from '../interfaces/ai-provider.interface';

type BlogGenerationOptions = {
  minWords?: number;
  maxWords?: number;
  tone?: string;
  keywords?: string[];
};

type BlogGenerationResult = {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  seoTitle: string;
  keywords: string[];
  tags: string[];
};

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get<string>('AI_API_KEY') || 'mock';
  }

  async generatePost(topic: string): Promise<GeneratedPostContent> {
    this.logger.log(`[OPENAI] Calling OpenAI for topic: ${topic}`);

    if (this.apiKey && this.apiKey !== 'mock') {
        try {
            return await this.callRealOpenAi(topic);
        } catch (e) {
            this.logger.error("Failed to call OpenAI, using fallback.", e);
        }
    } else {
        this.logger.warn("No AI_API_KEY provided. Using Mock Mode.");
    }

    // Mock Fallback with SEO-optimized content
    await new Promise(r => setTimeout(r, 1500));
    
    const year = new Date().getFullYear();
    const readingTime = 5;
    
    return {
      title: `The Ultimate Guide to ${topic} (${year})`,
      content: `
        <img src="/images/blog/placeholder-${Math.floor(Math.random() * 5) + 1}.jpg" alt="${topic} guide illustration" style="width:100%;max-width:800px;height:auto;margin:20px 0" />
        
        <h2>Introduction to ${topic}</h2>
        <p>This is a <strong>comprehensive ${year} guide</strong> about ${topic}. Whether you're a beginner or looking to enhance your expertise, this article covers everything you need to know about ${topic}.</p>
        
        <p>${topic} has become increasingly important in today's landscape. With the right approach and understanding, you can leverage ${topic} to achieve remarkable results in your projects and business.</p>
        
        <h2>Why ${topic} Matters in ${year}</h2>
        <p>Understanding ${topic} is crucial for success in the modern digital landscape. Here are the key reasons why:</p>
        <ul>
          <li><strong>Enhanced efficiency:</strong> ${topic} streamlines processes and saves valuable time</li>
          <li><strong>Competitive advantage:</strong> Master ${topic} to stay ahead of competitors</li>
          <li><strong>Cost-effective solutions:</strong> Proper implementation reduces operational costs</li>
          <li><strong>Improved results:</strong> Data shows ${topic} leads to measurable improvements</li>
        </ul>
        
        <h2>Getting Started with ${topic}</h2>
        <p>Starting your journey with ${topic} doesn't have to be complicated. Follow these essential steps:</p>
        <ol>
          <li>Research and understand the fundamentals of ${topic}</li>
          <li>Identify your specific needs and goals</li>
          <li>Choose the right tools and resources for ${topic}</li>
          <li>Implement a structured approach to learning</li>
          <li>Practice consistently and track your progress</li>
        </ol>
        
        <img src="/images/blog/steps-illustration.jpg" alt="Steps to master ${topic}" style="width:100%;max-width:700px;height:auto;margin:20px 0" />
        
        <h2>Best Practices for ${topic}</h2>
        <p>To maximize your success with ${topic}, follow these proven best practices used by industry experts:</p>
        <p><strong>1. Start with the basics:</strong> Build a solid foundation before advancing to complex concepts.</p>
        <p><strong>2. Learn from experts:</strong> Follow thought leaders and industry experts who specialize in ${topic}.</p>
        <p><strong>3. Apply knowledge immediately:</strong> Theory is important, but practical application accelerates learning.</p>
        <p><strong>4. Join communities:</strong> Connect with others interested in ${topic} to share insights and experiences.</p>
        <p><strong>5. Stay updated:</strong> ${topic} evolves constantly - keep learning and adapting your approach.</p>
        
        <h2>Common Mistakes to Avoid</h2>
        <p>Even experienced practitioners make mistakes with ${topic}. Here's what to watch out for:</p>
        <ul>
          <li>Rushing through the learning process without mastering fundamentals</li>
          <li>Ignoring best practices and industry standards</li>
          <li>Failing to test and validate your approach</li>
          <li>Not staying updated with latest trends and developments</li>
          <li>Overlooking the importance of continuous improvement</li>
        </ul>
        
        <h2>Advanced Techniques for ${topic}</h2>
        <p>Once you've mastered the basics, explore these advanced techniques to take your ${topic} skills to the next level:</p>
        <p>Advanced practitioners leverage automation, optimization strategies, and data-driven decision making to achieve superior results with ${topic}. Consider investing time in learning these sophisticated approaches.</p>
        
        <h2>Resources and Tools</h2>
        <p>Here are valuable resources to deepen your understanding of ${topic}:</p>
        <ul>
          <li>Online courses and tutorials covering ${topic} fundamentals and advanced concepts</li>
          <li>Industry publications and research papers on ${topic}</li>
          <li>Professional communities and forums dedicated to ${topic}</li>
          <li>Software tools and platforms optimized for ${topic}</li>
          <li>Books and guides written by ${topic} experts</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Mastering ${topic} is a journey that requires dedication, continuous learning, and practical application. By following the strategies and best practices outlined in this guide, you'll be well-equipped to achieve success with ${topic}.</p>
        
        <p>Remember that expertise in ${topic} develops over time. Start implementing what you've learned today, stay committed to improvement, and don't hesitate to seek guidance when needed. The investment you make in understanding ${topic} will pay dividends in your professional and personal growth.</p>
        
        <p><strong>Ready to take the next step?</strong> Explore our related articles on <a href="/blog">advanced ${topic} techniques</a> and join our community of practitioners.</p>
      `,
      summary: `A comprehensive ${year} guide to mastering ${topic}. Learn essential strategies, best practices, common mistakes to avoid, and advanced techniques from industry experts. Perfect for beginners and experienced practitioners.`,
      tags: [topic, 'Guide', 'Tutorial', `${year}`, 'Best Practices', 'How-To'],
      seoTitle: `${topic}: Complete Guide & Best Practices (${year})`,
      seoDescription: `Master ${topic} with our comprehensive ${year} guide. Expert tips, best practices, common mistakes, and actionable strategies. Updated for ${year}.`
    };
  }

  async optimizeSeo(content: string): Promise<SeoOptimizationResult> {
    return {
      score: 85,
      suggestions: ['Add more internal links', 'Use shorter paragraphs']
    };
  }

  private async callRealOpenAi(topic: string): Promise<GeneratedPostContent> {
      const prompt = `Write a comprehensive, SEO-optimized blog post about "${topic}".
      Return JSON with fields: title, content (HTML h2/p), summary, tags (array of strings), seoTitle, seoDescription.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
              model: 'gpt-4-turbo-preview', // Good default
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: "json_object" }
          })
      });

      if (!response.ok) {
          throw new Error(`OpenAI Error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
          title: result.title,
          content: result.content,
          summary: result.summary || result.seoDescription,
          tags: result.tags || [],
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription
      };
  }

  /**
   * Generate comprehensive blog post with specific requirements
   */
  async generateBlogPost(prompt: string, options: BlogGenerationOptions): Promise<BlogGenerationResult> {
    this.logger.log(`[OPENAI] Generating blog post with ${options.minWords}-${options.maxWords} words`);

    if (this.apiKey && this.apiKey !== 'mock') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI Error: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      } catch (error) {
        this.logger.error(`Real AI failed, using enhanced mock: ${error.message}`);
      }
    }

    // Enhanced mock for testing - creates realistic blog content
    return this.generateEnhancedMockBlog(options);
  }

  private generateEnhancedMockBlog(options: BlogGenerationOptions): BlogGenerationResult {
    const keywords = options.keywords || ['painting', 'wall services', 'UAE'];
    const primaryKeyword = keywords[0];
    const year = new Date().getFullYear();
    
    const title = `Professional ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Services: Complete ${year} Guide`;
    
    // Generate content that meets minimum word count
    const sections = [
      {
        heading: 'Introduction',
        content: `In the competitive landscape of ${year}, ${primaryKeyword} has become more crucial than ever before. Whether you're a homeowner, business owner, or property manager, understanding the nuances of professional ${primaryKeyword} services can make a significant difference in the outcome of your project. This comprehensive guide will walk you through everything you need to know about ${primaryKeyword}, from initial planning to final execution and maintenance.`
      },
      {
        heading: `Why Choose Professional ${primaryKeyword} Services`,
        content: `Professional ${primaryKeyword} services offer numerous advantages over DIY approaches. Expert technicians bring years of experience, specialized equipment, and industry knowledge that ensures superior results. When you invest in professional services, you're not just paying for labor  you're investing in quality, durability, and peace of mind. Professional providers understand the latest techniques, materials, and safety standards, ensuring your project meets or exceeds industry benchmarks. Additionally, professional services often come with warranties and guarantees, protecting your investment for years to come.`
      },
      {
        heading: 'Key Benefits and Advantages',
        content: `The benefits of professional ${primaryKeyword} extend far beyond the obvious aesthetic improvements. First and foremost, you gain access to expert knowledge and proven methodologies that have been refined over countless projects. Professional providers use premium materials that offer superior durability, weather resistance, and longevity compared to standard options. Time efficiency is another crucial advantage  what might take weeks for a DIY enthusiast can be completed in days by experienced professionals. Cost-effectiveness comes into play when you consider the reduced risk of errors, material waste, and the need for future repairs. Safety is paramount, especially for complex projects involving heights, chemicals, or specialized equipment. Professional teams are trained in safety protocols and carry appropriate insurance coverage.`
      },
      {
        heading: 'Understanding the Process',
        content: `A successful ${primaryKeyword} project follows a systematic process that begins with thorough consultation and assessment. During the initial phase, professionals evaluate your specific needs, space characteristics, and existing challenges that need addressing. This is followed by detailed planning where color schemes, materials, timelines, and budgets are established. Preparation is often the most critical phase  surfaces must be properly cleaned, repaired, and primed to ensure optimal adhesion and longevity. The application phase involves precise techniques that vary depending on the specific requirements of your project. Multiple coats may be necessary, with adequate drying time between applications. Quality control checks are performed throughout the process to maintain consistent standards. The final phase includes cleanup, inspection, and providing you with maintenance guidelines to preserve the results.`
      },
      {
        heading: 'Material Selection and Quality',
        content: `Choosing the right materials is fundamental to project success in ${primaryKeyword}. Premium materials offer superior coverage, durability, and resistance to environmental factors such as UV radiation, moisture, and temperature fluctuations. Different spaces require different material specifications  what works well for interior applications may not be suitable for exterior use. Consider factors like finish type (matte, satin, semi-gloss, or high-gloss), each offering distinct aesthetic and practical characteristics. Eco-friendly options have become increasingly popular, offering low-VOC formulations that minimize environmental impact and indoor air quality concerns. Professional providers stay updated on the latest material innovations and can recommend options that best suit your specific requirements and budget constraints.`
      },
      {
        heading: 'Cost Considerations and Budgeting',
        content: `Understanding the cost structure of ${primaryKeyword} services helps you make informed decisions and plan appropriately. Several factors influence overall costs, including project size, surface condition, material selection, and complexity of the work. Labor costs typically represent a significant portion of the total investment, reflecting the skill, experience, and time required. Material costs vary widely based on quality and quantity requirements. Additional expenses may include preparation work, repairs, special treatments, and protective coatings. While it's tempting to choose the lowest-priced option, remember that quality and durability should be primary considerations. Reputable providers offer detailed, transparent quotes that break down all costs, helping you understand exactly what you're paying for. Many professionals also offer flexible payment plans and financing options to accommodate various budget scenarios.`
      },
      {
        heading: 'Timeline and Project Planning',
        content: `Proper timeline planning ensures your ${primaryKeyword} project proceeds smoothly without unexpected delays or disruptions. Most projects require advance scheduling, especially during peak seasons when professional providers may have limited availability. The duration of your project depends on multiple factors including size, complexity, weather conditions (for exterior work), and drying times between coats. A typical residential project might span several days to a couple of weeks, while commercial projects can extend significantly longer. Communicate clearly with your provider about time-sensitive deadlines or constraints. Factors that can affect timelines include weather delays (for exterior work), discovery of unexpected issues requiring repair, material availability, and curing times for specialized finishes. Professional providers should provide realistic timelines with built-in buffers for unexpected circumstances.`
      },
      {
        heading: 'Maintenance and Longevity',
        content: `Proper maintenance significantly extends the life and appearance of your ${primaryKeyword} investment. Regular cleaning with appropriate methods prevents buildup of dirt, grime, and other contaminants that can degrade surfaces over time. Inspect periodically for signs of wear, damage, or deterioration, addressing issues promptly to prevent more extensive problems. Touch-ups may be necessary in high-traffic areas or places subject to wear and tear. Environmental factors play a significant role  exterior surfaces face challenges from sun exposure, weather, and temperature fluctuations. Understanding the expected lifespan of different materials and finishes helps you plan for future maintenance or replacement. Professional providers often offer maintenance services and can create customized maintenance schedules based on your specific situation. Documentation of original work, including materials used and application techniques, facilitates future maintenance and repairs.`
      },
      {
        heading: 'Choosing the Right Provider',
        content: `Selecting the right professional for your ${primaryKeyword} project is crucial to achieving desired results. Start by verifying credentials, licenses, and insurance coverage to ensure you're working with legitimate, qualified professionals. Experience matters  look for providers with proven track records in projects similar to yours. Review portfolios and previous work examples to assess quality and style alignment. Customer testimonials and reviews provide valuable insights into reliability, professionalism, and customer satisfaction. Obtain multiple detailed quotes for comparison, but don't base decisions solely on price. Communication style and responsiveness during initial interactions often reflect how they'll handle your project. Ask about warranties, guarantees, and post-project support. Understand their process, timeline commitments, and how they handle unexpected issues or changes. Reputable providers are transparent, professional, and willing to answer all your questions thoroughly.`
      },
      {
        heading: 'Conclusion and Next Steps',
        content: `Professional ${primaryKeyword} services represent an investment in your property's appearance, value, and longevity. By understanding the key factors we've discussed  from process and materials to costs and maintenance  you're well-equipped to make informed decisions for your project. Take time to research providers, ask questions, and verify credentials before committing. Remember that the lowest price rarely delivers the best value; focus instead on quality, experience, and reputation. Whether you're planning a residential refresh or a large commercial project, professional ${primaryKeyword} services deliver results that stand the test of time. Ready to get started? Contact reputable local providers for consultations and quotes, and take the first step toward transforming your space with professional expertise.`
      }
    ];

    let htmlContent = '';
    sections.forEach(section => {
      htmlContent += `<h2>${section.heading}</h2>\n<p>${section.content}</p>\n\n`;
    });

    const tags = [
      primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1),
      'Professional Services',
      'UAE',
      'Home Improvement',
      'Quality Services',
      ...keywords.slice(1, 4)
    ];

    return {
      title: title,
      content: htmlContent,
      excerpt: `Discover everything you need to know about professional ${primaryKeyword} services in this comprehensive ${year} guide. Expert insights, practical tips, and valuable information for homeowners and businesses.`,
      metaDescription: `Complete guide to professional ${primaryKeyword} services in ${year}. Learn about benefits, costs, process, and how to choose the right provider for your project.`,
      seoTitle: title,
      keywords: keywords,
      tags: tags
    };
  }
}


