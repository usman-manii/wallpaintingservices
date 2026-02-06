export type HeroContent = {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
};

export type ContentColumn = { content?: string };
export type ContentSectionContent = {
  heading?: string;
  text?: string;
  leftColumn?: string;
  rightColumn?: string;
  columns?: ContentColumn[];
};

export type FeatureItem = {
  icon?: string;
  title?: string;
  description?: string;
};
export type FeaturesContent = {
  title?: string;
  features?: FeatureItem[];
};

export type CTAButton = { text?: string; link?: string };
export type CTAContent = {
  title?: string;
  subtitle?: string;
  text?: string;
  buttonText?: string;
  buttonLink?: string;
  primaryButton?: CTAButton;
  secondaryButton?: CTAButton;
};

export type Testimonial = {
  text?: string;
  name?: string;
  role?: string;
  company?: string;
  avatar?: string;
};
export type TestimonialsContent = {
  title?: string;
  testimonials?: Testimonial[];
};

export type FormField = {
  type?: string;
  name?: string;
  label?: string;
  required?: boolean;
};
export type FormContent = {
  title?: string;
  subtitle?: string;
  fields?: FormField[];
  placeholder?: string;
  buttonText?: string;
};

export type MediaImage = { url?: string; alt?: string; caption?: string };
export type MediaContent = {
  images?: MediaImage[];
  videoUrl?: string;
  title?: string;
  description?: string;
};

export type PricingPlan = {
  name?: string;
  price?: string;
  period?: string;
  features?: string[];
  buttonText?: string;
  highlighted?: boolean;
};
export type PricingContent = {
  title?: string;
  plans?: PricingPlan[];
};

export type TeamMember = {
  name?: string;
  role?: string;
  bio?: string;
  image?: string;
};
export type TeamContent = {
  title?: string;
  members?: TeamMember[];
};

export type StatItem = { icon?: string; number?: string; label?: string };
export type StatsContent = { stats?: StatItem[] };

export type FAQItem = { question?: string; answer?: string };
export type FAQContent = { title?: string; faqs?: FAQItem[] };

export type GenericContent = { title?: string; subtitle?: string; text?: string };
