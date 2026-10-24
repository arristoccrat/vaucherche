/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Internal tool: never indexed, never framed, no referrer leaks to
        // the merchant sites it links out to.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
