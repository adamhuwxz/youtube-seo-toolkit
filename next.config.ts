import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // OLD TOOL URLS → NEW STRUCTURE
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

      // OLD MAIN FEATURE
      {
        source: "/workflow",
        destination: "/tools",
        permanent: true,
      },

      // SAFETY: catch common variations
      {
        source: "/tools/:slug*",
        has: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        destination: "/tools",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;