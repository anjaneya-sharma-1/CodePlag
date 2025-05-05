/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  distDir: 'dist', // Change build output directory
  images: {
    unoptimized: true, // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: '/CodePlag', // Add this if deploying to GitHub Pages under a sub-path
}

export default nextConfig
