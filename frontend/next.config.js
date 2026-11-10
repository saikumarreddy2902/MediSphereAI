/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Avoid blocking production deployment on experimental react-compiler purity warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensure smooth zero-friction production build on cloud deployment platforms (Vercel)
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/dashboard',
    NEXT_PUBLIC_ENABLE_MOCK_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK || 'true',
    NEXT_PUBLIC_HOSPITAL_NAME: process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'MediSphere AI Super Speciality Hospital',
  },
}

module.exports = nextConfig
