import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@friendscircle/shared",
    "@friendscircle/supabase",
  ],
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
