export {};

type GrecaptchaClient = {
  ready?: (callback: () => void) => void;
  execute?: (siteKey: string, options: { action: string }) => Promise<string>;
  render?: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      theme?: 'dark' | 'light';
    }
  ) => number | void;
  reset?: (widgetId: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: GrecaptchaClient;
  }
}
