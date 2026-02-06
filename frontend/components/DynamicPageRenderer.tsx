'use client';

import { useEffect, useState, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import type { PageSection } from '@/lib/page-builder-types';
import type { JsonValue } from '@/types/json';
import { SafeHtml } from '@/components/SafeHtml';
import logger from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';
import type {
  HeroContent,
  ContentSectionContent,
  FeaturesContent,
  CTAContent,
  TestimonialsContent,
  FormContent,
  MediaContent,
  PricingContent,
  TeamContent,
  StatsContent,
  FAQContent,
  GenericContent,
} from '@/lib/page-renderer-content';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content:
    | {
        sections: PageSection[];
        globalStyles?: Record<string, JsonValue>;
      }
    | string;
  seoTitle?: string;
  seoDescription?: string;
  customCss?: string;
  customJs?: string;
}

export default function DynamicPageRenderer({ slug }: { slug: string }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    try {
      if (slug.startsWith('dashboard/') || slug.startsWith('auth/') || slug.startsWith('admin/')) {
        notFound();
        return;
      }

      const data = await fetchAPI<PageData>(`/pages/slug/${slug}`);
      if (!data) {
        notFound();
        return;
      }
      setPage(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to load page');
      if (!message.includes('404') && !message.includes('Not Found')) {
        logger.error('Error fetching page', error, { component: 'DynamicPageRenderer', slug });
      }
      notFound();
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    if (page?.customCss) {
      logger.warn('Custom CSS injection is disabled. Use theme customization instead.', {
        component: 'DynamicPageRenderer',
        slug,
      });
    }
  }, [page, slug]);

  useEffect(() => {
    if (page?.customJs) {
      logger.error('Custom JavaScript injection is disabled for security reasons.', {
        component: 'DynamicPageRenderer',
        slug,
      });
    }
  }, [page, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!page) {
    return notFound();
  }

  return (
    <div className="min-h-screen">
      {typeof page.content === 'string' ? (
        <div className="container mx-auto px-4 py-12">
          <SafeHtml html={page.content} as="div" />
        </div>
      ) : (
        page.content?.sections?.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))
      )}
    </div>
  );
}

function SectionRenderer({ section }: { section: PageSection }) {
  const styles = section.styles || {};

  const sectionStyle: React.CSSProperties = {
    padding: `${styles.padding?.top || 0}px ${styles.padding?.right || 0}px ${styles.padding?.bottom || 0}px ${styles.padding?.left || 0}px`,
    margin: `${styles.margin?.top || 0}px ${styles.margin?.right || 0}px ${styles.margin?.bottom || 0}px ${styles.margin?.left || 0}px`,
    backgroundColor: styles.background?.color || 'transparent',
    backgroundImage: styles.background?.gradient || (styles.background?.image ? `url(${styles.background.image})` : 'none'),
    borderWidth: styles.border?.width || 0,
    borderColor: styles.border?.color || 'transparent',
    borderRadius: styles.border?.radius || 0,
    borderStyle: styles.border?.style || 'solid',
  };

  switch (section.type) {
    case 'hero':
      return <HeroSection section={section} style={sectionStyle} />;
    case 'content':
      return <ContentSection section={section} style={sectionStyle} />;
    case 'features':
      return <FeaturesSection section={section} style={sectionStyle} />;
    case 'cta':
      return <CTASection section={section} style={sectionStyle} />;
    case 'testimonials':
      return <TestimonialsSection section={section} style={sectionStyle} />;
    case 'form':
      return <FormSection section={section} style={sectionStyle} />;
    case 'media':
      return <MediaSection section={section} style={sectionStyle} />;
    case 'pricing':
      return <PricingSection section={section} style={sectionStyle} />;
    case 'team':
      return <TeamSection section={section} style={sectionStyle} />;
    case 'stats':
      return <StatsSection section={section} style={sectionStyle} />;
    case 'faq':
      return <FAQSection section={section} style={sectionStyle} />;
    case 'divider':
      return <DividerSection section={section} style={sectionStyle} />;
    case 'spacer': {
      const height = typeof section.config.height === 'number' ? section.config.height : 60;
      return <div style={{ height }} />;
    }
    default:
      return <GenericSection section={section} style={sectionStyle} />;
  }
}

function HeroSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, subtitle, buttonText, buttonLink, backgroundImage } = section.content as HeroContent;

  return (
    <section style={style} className="relative overflow-hidden">
      {backgroundImage && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      )}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {title && <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">{title}</h1>}
          {subtitle && <p className="text-xl text-white/90 mb-8">{subtitle}</p>}
          {buttonText && buttonLink && (
            <a href={buttonLink} className="inline-block px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
              {buttonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function ContentSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { heading, text, leftColumn, rightColumn, columns } = section.content as ContentSectionContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {heading && <h2 className="text-3xl font-bold mb-6">{heading}</h2>}
        {text && <SafeHtml html={text} as="div" />}
        {leftColumn && rightColumn && (
          <div className="grid md:grid-cols-2 gap-8">
            <SafeHtml html={leftColumn} as="div" />
            <SafeHtml html={rightColumn} as="div" />
          </div>
        )}
        {columns && (
          <div className="grid md:grid-cols-3 gap-6">
            {columns.map((col, i) => (
              <SafeHtml key={i} html={col.content || ''} as="div" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturesSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, features } = section.content as FeaturesContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
        <div className="grid md:grid-cols-3 gap-8">
          {features?.map((feature, i: number) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, subtitle, buttonText, buttonLink, text, primaryButton, secondaryButton } = section.content as CTAContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4 text-center">
        {title && <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>}
        {subtitle && <p className="text-xl text-white/90 mb-8">{subtitle}</p>}
        {text && <p className="text-white/80 mb-8">{text}</p>}
        <div className="flex gap-4 justify-center">
          {(buttonText || primaryButton) && (
            <a href={buttonLink || primaryButton?.link} className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
              {buttonText || primaryButton?.text}
            </a>
          )}
          {secondaryButton && (
            <a href={secondaryButton.link} className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              {secondaryButton.text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, testimonials } = section.content as TestimonialsContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials?.map((testimonial, i: number) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-slate-700 mb-4">"{testimonial.text}"</p>
              <div className="flex items-center">
                {testimonial.avatar && (
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                )}
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-slate-600">{testimonial.role} {testimonial.company && `at ${testimonial.company}`}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FormSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, subtitle, fields, placeholder, buttonText } = section.content as FormContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4 max-w-2xl">
        {title && <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>}
        {subtitle && <p className="text-center text-slate-600 mb-8">{subtitle}</p>}
        <form className="space-y-4">
          {fields ? (
            fields.map((field, i: number) => (
              <div key={i}>
                {field.label && <label className="block text-sm font-medium mb-2">{field.label}</label>}
                {field.type === 'textarea' ? (
                  <textarea name={field.name} required={field.required} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={4} />
                ) : (
                  <input type={field.type} name={field.name} required={field.required} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
            ))
          ) : (
            <input type="email" placeholder={placeholder || 'Enter your email'} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          )}
          <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            {buttonText || 'Submit'}
          </button>
        </form>
      </div>
    </section>
  );
}

function MediaSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { images, videoUrl, title, description } = section.content as MediaContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {images && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i: number) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg">
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        {videoUrl && (
          <div className="max-w-4xl mx-auto">
            {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-slate-600 mb-6">{description}</p>}
            <div className="aspect-video">
              <iframe src={videoUrl} className="w-full h-full rounded-lg" allowFullScreen />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, plans } = section.content as PricingContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans?.map((plan, i: number) => (
            <div key={i} className={`bg-white rounded-lg shadow-lg p-8 ${plan.highlighted ? 'ring-2 ring-blue-500 transform scale-105' : ''}`}>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {plan.price}<span className="text-lg font-normal text-slate-600">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features?.map((feature: string, j: number) => (
                  <li key={j} className="flex items-center text-slate-700">
                    <span className="text-green-500 mr-2">*</span> {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, members } = section.content as TeamContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
        <div className="grid md:grid-cols-4 gap-8">
          {members?.map((member, i: number) => (
            <div key={i} className="text-center">
              {member.image && (
                <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
              )}
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-slate-600 mb-2">{member.role}</p>
              {member.bio && <p className="text-sm text-slate-500">{member.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { stats } = section.content as StatsContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats?.map((stat, i: number) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const { title, faqs } = section.content as FAQContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4 max-w-3xl">
        {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
        <div className="space-y-4">
          {faqs?.map((faq, i: number) => (
            <details key={i} className="bg-white rounded-lg shadow p-6">
              <summary className="font-semibold cursor-pointer">{faq.question}</summary>
              <p className="mt-4 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function DividerSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        <hr className="border-slate-300" />
      </div>
    </section>
  );
}

function GenericSection({ section, style }: { section: PageSection; style: React.CSSProperties }) {
  const content = section.content as GenericContent;

  return (
    <section style={style}>
      <div className="container mx-auto px-4">
        {content.title && <h2 className="text-3xl font-bold mb-6">{content.title}</h2>}
        {content.subtitle && <p className="text-xl text-slate-600 mb-4">{content.subtitle}</p>}
        {content.text && <SafeHtml html={content.text} as="div" />}
      </div>
    </section>
  );
}
