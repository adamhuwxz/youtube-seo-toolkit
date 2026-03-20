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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com https://accounts.google.com https://apis.google.com",
              // Added firebaseapp.com to frame-src for popups/iframes
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com https://accounts.google.com https://*.firebaseapp.com",
              // Added firebaseapp.com to connect-src for auth polling/requests
              "connect-src 'self' https://api.stripe.com https://r.stripe.com https://b.stripecdn.com https://newassets.hcaptcha.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com",
              "img-src 'self' data: https://*.stripe.com https://*.hcaptcha.com https://*.googleusercontent.com",
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