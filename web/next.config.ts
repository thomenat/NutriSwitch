import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: (() => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return undefined;
    let hostname: string | null = null;
    try {
      hostname = new URL(supabaseUrl).hostname;
    } catch {
      hostname = null;
    }
    if (!hostname) return undefined;

    return {
      remotePatterns: [
        {
          protocol: "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        },
      ],
    } satisfies NonNullable<NextConfig["images"]>;
  })(),
};

export default nextConfig;
