/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Add the real image host(s) here once product/CMS images are hosted
      // (e.g. your storage bucket or CDN domain).
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
