import type { JsonValue } from '@/types/json';

export interface PageSection {
  id: string;
  type: string;
  config: Record<string, JsonValue>;
  content: Record<string, JsonValue>;
  styles: SectionStyles;
  children?: PageSection[];
}

export interface SectionStyles {
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  background?: {
    color?: string;
    image?: string;
    gradient?: string;
    opacity?: number;
  };
  border?: {
    width?: number;
    color?: string;
    radius?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  };
  responsive?: {
    mobile?: Partial<SectionStyles>;
    tablet?: Partial<SectionStyles>;
  };
}

export interface PageBuilderState {
  sections: PageSection[];
  globalStyles: {
    colors: { primary: string; secondary: string; accent: string };
    fonts: { heading: string; body: string };
    spacing: { unit: number };
  };
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: string;
  defaultConfig: Record<string, JsonValue>;
  defaultContent: Record<string, JsonValue>;
  defaultStyles: SectionStyles;
  thumbnail?: string;
}

// Pre-defined component library inspired by Elementor, Divi, Bakery
export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  // HERO SECTIONS
  {
    id: 'hero-basic',
    name: 'Basic Hero',
    type: 'hero',
    category: 'Hero Sections',
    icon: '🎯',
    defaultConfig: { alignment: 'center', overlay: true },
    defaultContent: {
      title: 'Welcome to Our Website',
      subtitle: 'Create amazing experiences',
      buttonText: 'Get Started',
      buttonLink: '#',
      backgroundImage: '',
    },
    defaultStyles: {
      padding: { top: 120, bottom: 120 },
      background: { color: '#3b82f6', opacity: 0.9 },
    },
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    type: 'hero',
    category: 'Hero Sections',
    icon: '📱',
    defaultConfig: { imagePosition: 'right', alignment: 'left' },
    defaultContent: {
      title: 'Innovative Solutions',
      subtitle: 'Transform your business',
      buttonText: 'Learn More',
      buttonLink: '#',
      image: '',
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { color: '#ffffff' },
    },
  },

  // CONTENT SECTIONS
  {
    id: 'text-block',
    name: 'Text Block',
    type: 'content',
    category: 'Content',
    icon: '📝',
    defaultConfig: { width: 'contained', alignment: 'left' },
    defaultContent: {
      heading: 'Section Heading',
      text: '<p>Your content goes here...</p>',
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },
  {
    id: 'two-column',
    name: 'Two Columns',
    type: 'content',
    category: 'Content',
    icon: '📊',
    defaultConfig: { ratio: '50-50', gap: 32 },
    defaultContent: {
      leftColumn: '<p>Left column content</p>',
      rightColumn: '<p>Right column content</p>',
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },
  {
    id: 'three-column',
    name: 'Three Columns',
    type: 'content',
    category: 'Content',
    icon: '📑',
    defaultConfig: { gap: 24 },
    defaultContent: {
      columns: [
        { content: '<p>Column 1</p>' },
        { content: '<p>Column 2</p>' },
        { content: '<p>Column 3</p>' },
      ],
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },

  // FEATURE SECTIONS
  {
    id: 'features-grid',
    name: 'Features Grid',
    type: 'features',
    category: 'Features',
    icon: '⭐',
    defaultConfig: { columns: 3, iconStyle: 'outlined' },
    defaultContent: {
      title: 'Our Features',
      features: [
        { icon: '🚀', title: 'Fast', description: 'Lightning fast performance' },
        { icon: '🔒', title: 'Secure', description: 'Bank-level security' },
        { icon: '💡', title: 'Smart', description: 'Intelligent features' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { color: '#f8fafc' },
    },
  },
  {
    id: 'features-cards',
    name: 'Feature Cards',
    type: 'features',
    category: 'Features',
    icon: '🎴',
    defaultConfig: { columns: 2, cardStyle: 'elevated' },
    defaultContent: {
      features: [
        { image: '', title: 'Feature One', description: 'Description here', link: '#' },
        { image: '', title: 'Feature Two', description: 'Description here', link: '#' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
    },
  },

  // CALL TO ACTION
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    type: 'cta',
    category: 'Call to Action',
    icon: '📣',
    defaultConfig: { alignment: 'center', style: 'filled' },
    defaultContent: {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of satisfied customers',
      buttonText: 'Sign Up Now',
      buttonLink: '#',
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    },
  },
  {
    id: 'cta-box',
    name: 'CTA Box',
    type: 'cta',
    category: 'Call to Action',
    icon: '📦',
    defaultConfig: { centered: true },
    defaultContent: {
      title: 'Take Action Today',
      text: 'Limited time offer',
      primaryButton: { text: 'Get Started', link: '#' },
      secondaryButton: { text: 'Learn More', link: '#' },
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
      background: { color: '#ffffff' },
      border: { width: 2, color: '#e2e8f0', radius: 16 },
    },
  },

  // TESTIMONIALS
  {
    id: 'testimonials-slider',
    name: 'Testimonials Slider',
    type: 'testimonials',
    category: 'Social Proof',
    icon: '💬',
    defaultConfig: { autoplay: true, interval: 5000 },
    defaultContent: {
      title: 'What Our Clients Say',
      testimonials: [
        { name: 'John Doe', role: 'CEO', company: 'Company Inc.', text: 'Amazing service!', avatar: '' },
        { name: 'Jane Smith', role: 'Manager', company: 'Business LLC', text: 'Highly recommended!', avatar: '' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { color: '#f8fafc' },
    },
  },
  {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    type: 'testimonials',
    category: 'Social Proof',
    icon: '🗣️',
    defaultConfig: { columns: 3 },
    defaultContent: {
      testimonials: [
        { name: 'Client 1', text: 'Great experience', rating: 5 },
        { name: 'Client 2', text: 'Excellent work', rating: 5 },
        { name: 'Client 3', text: 'Very professional', rating: 5 },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
    },
  },

  // FORMS
  {
    id: 'contact-form',
    name: 'Contact Form',
    type: 'form',
    category: 'Forms',
    icon: '📧',
    defaultConfig: { layout: 'stacked', submitText: 'Send Message' },
    defaultContent: {
      title: 'Get in Touch',
      fields: [
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'email', name: 'email', label: 'Email', required: true },
        { type: 'textarea', name: 'message', label: 'Message', required: true },
      ],
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },
  {
    id: 'newsletter-form',
    name: 'Newsletter Form',
    type: 'form',
    category: 'Forms',
    icon: '📮',
    defaultConfig: { inline: true },
    defaultContent: {
      title: 'Subscribe to Our Newsletter',
      subtitle: 'Get updates delivered to your inbox',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
      background: { color: '#3b82f6' },
    },
  },

  // MEDIA
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    type: 'media',
    category: 'Media',
    icon: '🖼️',
    defaultConfig: { columns: 4, gap: 16, lightbox: true },
    defaultContent: {
      images: [
        { url: '', alt: '', caption: '' },
        { url: '', alt: '', caption: '' },
        { url: '', alt: '', caption: '' },
        { url: '', alt: '', caption: '' },
      ],
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },
  {
    id: 'video-embed',
    name: 'Video Embed',
    type: 'media',
    category: 'Media',
    icon: '🎥',
    defaultConfig: { aspectRatio: '16:9', autoplay: false },
    defaultContent: {
      videoUrl: 'https://www.youtube.com/embed/',
      title: 'Video Title',
      description: 'Video description',
    },
    defaultStyles: {
      padding: { top: 60, bottom: 60 },
    },
  },

  // PRICING
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    type: 'pricing',
    category: 'Pricing',
    icon: '💰',
    defaultConfig: { columns: 3, highlight: 1 },
    defaultContent: {
      title: 'Choose Your Plan',
      plans: [
        { name: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], buttonText: 'Get Started' },
        { name: 'Pro', price: '$29', period: '/month', features: ['All Basic', 'Feature 3', 'Feature 4'], buttonText: 'Get Started', highlighted: true },
        { name: 'Enterprise', price: '$99', period: '/month', features: ['All Pro', 'Feature 5', 'Priority Support'], buttonText: 'Contact Us' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { color: '#f8fafc' },
    },
  },

  // TEAM
  {
    id: 'team-grid',
    name: 'Team Grid',
    type: 'team',
    category: 'Team',
    icon: '👥',
    defaultConfig: { columns: 4, showSocial: true },
    defaultContent: {
      title: 'Meet Our Team',
      members: [
        { name: 'Team Member', role: 'Position', bio: '', image: '', social: { linkedin: '', twitter: '' } },
        { name: 'Team Member', role: 'Position', bio: '', image: '', social: { linkedin: '', twitter: '' } },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
    },
  },

  // STATS/COUNTERS
  {
    id: 'stats-counter',
    name: 'Stats Counter',
    type: 'stats',
    category: 'Stats',
    icon: '📊',
    defaultConfig: { columns: 4, animated: true },
    defaultContent: {
      stats: [
        { number: '1000+', label: 'Happy Clients', icon: '😊' },
        { number: '50+', label: 'Team Members', icon: '👥' },
        { number: '100%', label: 'Success Rate', icon: '🎯' },
        { number: '24/7', label: 'Support', icon: '💬' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
      background: { color: '#1e293b' },
    },
  },

  // FAQ
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    type: 'faq',
    category: 'FAQ',
    icon: '❓',
    defaultConfig: { allowMultiple: false },
    defaultContent: {
      title: 'Frequently Asked Questions',
      faqs: [
        { question: 'Question 1?', answer: 'Answer to question 1' },
        { question: 'Question 2?', answer: 'Answer to question 2' },
        { question: 'Question 3?', answer: 'Answer to question 3' },
      ],
    },
    defaultStyles: {
      padding: { top: 80, bottom: 80 },
    },
  },

  // DIVIDERS
  {
    id: 'divider',
    name: 'Divider',
    type: 'divider',
    category: 'Elements',
    icon: '➖',
    defaultConfig: { style: 'solid', alignment: 'center', width: 100 },
    defaultContent: { icon: '' },
    defaultStyles: {
      padding: { top: 40, bottom: 40 },
    },
  },

  // SPACER
  {
    id: 'spacer',
    name: 'Spacer',
    type: 'spacer',
    category: 'Elements',
    icon: '⬛',
    defaultConfig: { height: 60 },
    defaultContent: {},
    defaultStyles: {},
  },
];

export const COMPONENT_CATEGORIES = [
  'Hero Sections',
  'Content',
  'Features',
  'Call to Action',
  'Social Proof',
  'Forms',
  'Media',
  'Pricing',
  'Team',
  'Stats',
  'FAQ',
  'Elements',
];
