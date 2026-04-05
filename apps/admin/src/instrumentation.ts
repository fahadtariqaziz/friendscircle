import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.level === "error") return breadcrumb;
        return null;
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
