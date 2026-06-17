import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Fail production builds that are missing the public Supabase config, so the
// app can never ship without a usable backend. Set ALLOW_MISSING_SUPABASE=true
// to bypass intentionally (e.g. a marketing-only preview).
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_MISSING_SUPABASE !== "true" &&
  (!supabaseUrl || !supabasePublishableKey)
) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the production build. " +
      "Set them in the host env, or set ALLOW_MISSING_SUPABASE=true to bypass.",
  );
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
