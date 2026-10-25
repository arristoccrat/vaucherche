// Shop logos and covers are served from our own Supabase Storage bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol.replace(":", ""),
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/shop-media/**",
          },
        ]
      : [],
  },
  experimental: {
    // Logo / cover uploads go through a Server Action (images capped at 2 MB
    // in src/lib/images.ts; this leaves room for the form encoding).
    serverActions: { bodySizeLimit: "3mb" },
  },
  async headers() {
    // The admin is an internal tool: never indexed, never framed, no
    // referrer leaks to the merchant sites it links out to.
    const adminHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/admin", headers: adminHeaders },
      { source: "/admin/:path*", headers: adminHeaders },
    ];
  },
};

export default nextConfig;
