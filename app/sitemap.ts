import { MetadataRoute } from 'next';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// This tells Next.js to generate this on-the-fly when requested
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://seotube.io';

  // 1. Define your static pages first (Always safe)
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    // 2. Try to fetch dynamic blog posts
    const postsQuery = query(collection(db, "posts"), where("published", "==", true));
    const querySnapshot = await getDocs(postsQuery);
    
    const blogPosts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/blog/${data.slug}`,
        lastModified: data.createdAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    return [...staticPages, ...blogPosts];
  } catch (error) {
    // 3. Fallback: If Firebase blocks the build bot, just return static pages
    // This prevents the "Missing Permissions" build error
    console.error("Sitemap generation skipped dynamic posts due to permissions:", error);
    return staticPages;
  }
}