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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com",
              "connect-src 'self' https://api.stripe.com https://r.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com",
              "img-src 'self' data: https://*.stripe.com https://*.hcaptcha.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;