/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'plus.unsplash.com',
      'images.unsplash.com',
      'i.pinimg.com',
      'i.pravatar.cc',
      'localhost',
      'dns.bento.showcase.200lab.io',
      'statics.cdn.200lab.io',
      'imgoss.cnu.cc',
      'res.cloudinary.com'
    ],
  },
  output: 'standalone',
};

export default nextConfig;
