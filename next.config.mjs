/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Adicione o basePath se seu repositório não for username.github.io
  // basePath: '/nome-do-seu-repositorio',
  // assetPrefix: '/nome-do-seu-repositorio/',
};

export default nextConfig;
