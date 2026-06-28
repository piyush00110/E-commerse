/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['react-router-dom'] = path.join(__dirname, 'src/lib/legacy-router.tsx');
    return config;
  },
};

module.exports = nextConfig;
