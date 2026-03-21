import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/', // Keeps search engines out of your private kitchen!
    },
    sitemap: 'https://seotube.io/sitemap.xml',
  };
}