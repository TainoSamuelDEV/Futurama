/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Allow opening the dev server from your LAN IP
  allowedDevOrigins: ['192.168.1.36', '172.18.192.1', '192.168.1.9'],
  // Adicione o basePath se seu repositório não for username.github.io
  // basePath: '/nome-do-seu-repositorio',
  // assetPrefix: '/nome-do-seu-repositorio/',
};

export default nextConfig;
