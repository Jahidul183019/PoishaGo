export const logger = {
  error: (message: string, ...optionalParams: any[]) => {
    if (import.meta.env.MODE === 'development') {
      console.error(message, ...optionalParams);
    }
    // TODO: Route to Sentry/Datadog in production
  },
  warn: (message: string, ...optionalParams: any[]) => {
    if (import.meta.env.MODE === 'development') {
      console.warn(message, ...optionalParams);
    }
  },
  info: (message: string, ...optionalParams: any[]) => {
    if (import.meta.env.MODE === 'development') {
      console.info(message, ...optionalParams);
    }
  }
};
