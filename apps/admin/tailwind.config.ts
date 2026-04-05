import type { Config } from "tailwindcss";
import sharedConfig from "@friendscircle/config/tailwind.config";

const config: Config = {
  ...sharedConfig,
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
