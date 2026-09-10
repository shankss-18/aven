/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
        pathname: "/**",
      },
    ],
  },
  // Enables Next.js standalone output — smaller, faster Vercel deploys
  // output: "standalone", // Uncomment if you need custom Docker deployment
};

export default nextConfig;
