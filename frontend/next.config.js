// Next.js config for Vercel deployment
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api/* to the backend so the browser makes same-origin requests (avoids CORS / "Failed to fetch")
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5134";
    return [{ source: "/api/:path*", destination: `${target.replace(/\/$/, "")}/:path*` }];
  },
};

module.exports = nextConfig;
