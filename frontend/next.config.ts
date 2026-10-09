import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge/**/*"],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
    const destino = (ruta: string) => ({ source: ruta, destination: `${api}${ruta}` });
    // /api/chat se queda en este proyecto. El resto sigue yendo al backend de recetas.
    return {
      afterFiles: [
        destino("/api/recetas/:path*"),
        destino("/api/categorias"),
        destino("/api/favoritos"),
        destino("/api/favoritos/:path*"),
        destino("/api/plan"),
        destino("/api/plan/:path*"),
      ],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.themealdb.com", pathname: "/images/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
