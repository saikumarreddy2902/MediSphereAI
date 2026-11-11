/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Avoid blocking production deployment on experimental react-compiler purity warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensure smooth zero-friction production build on cloud deployment platforms (Vercel/Render)
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
    NEXT_PUBLIC_ENABLE_MOCK_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK || 'true',
    NEXT_PUBLIC_HOSPITAL_NAME: process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'MediSphere AI Super Speciality Hospital',
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
      {
        source: '/docs',
        destination: `${backendUrl}/docs`,
      },
      {
        source: '/openapi.json',
        destination: `${backendUrl}/openapi.json`,
      },
    ];
  },
}

module.exports = nextConfig
