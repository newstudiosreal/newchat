/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disabilita static generation per evitare errori build-time con env vars
  output: 'standalone',
}

module.exports = nextConfig
