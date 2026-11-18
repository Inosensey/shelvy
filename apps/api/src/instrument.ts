import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
    }
    return event;
  },
});
