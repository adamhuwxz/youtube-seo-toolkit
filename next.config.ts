import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/tools/tag-generator",
        destination: "/tools/tags",
        permanent: true,
      },
      {
        source: "/tools/title-optimizer",
        destination: "/tools/titles",
        permanent: true,
      },
      {
        source: "/tools/description-generator",
        destination: "/tools/descriptions",
        permanent: true,
      },
      {
        source: "/tools/transcript-cleaner",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/tools/transcript-extractor",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/tools/elevenlabs-formatter",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/workflow",
        destination: "/tools",
        permanent: true,
      },
    ];
  },

  async headers() {
  return [];
}
};

export default nextConfig;