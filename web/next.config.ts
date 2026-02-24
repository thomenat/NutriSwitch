import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: (() => {
    const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ];
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const hostname = new URL(supabaseUrl).hostname;
        patterns.push({
          protocol: "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        });
      } catch {
        // ignore invalid URL
      }
    }
    return { remotePatterns: patterns } satisfies NonNullable<NextConfig["images"]>;
  })(),
};

export default nextConfig;
