/** @type {import('next').NextConfig} */
const nextConfig = {
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
