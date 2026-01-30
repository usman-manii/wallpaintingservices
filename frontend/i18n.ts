import { getRequestConfig } from 'next-intl/server';

/**
 * Next-intl configuration for internationalization
 * Loads translations based on user's locale
 */
export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always a string (fallback to 'en')
  const validLocale = locale || 'en';
  
  return {
    locale: validLocale,
    messages: (await import(`./locales/${validLocale}.json`)).default,
  };
});
