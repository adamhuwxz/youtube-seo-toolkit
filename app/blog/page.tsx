import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
export const dynamic = 'force-dynamic';

// 1. Define the Interface to satisfy TypeScript and ESLint
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  createdAt?: Timestamp;
  published?: boolean;
}

export const metadata = {
  title: "YouTube Growth Blog | SEOTube",
  description: "Expert guides on YouTube SEO, algorithm updates, and AI creator tools.",
};

export default async function BlogListPage() {
  // 2. Fetch data from Firestore
  const postsCollection = collection(db, "posts");
  const postsQuery = query(postsCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(postsQuery);
  
  // 3. Map the docs and cast them to the BlogPost type
  const posts: BlogPost[] = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "",
      slug: data.slug || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      createdAt: data.createdAt,
      published: data.published,
    } as BlogPost;
  });

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <section className="max-w-5xl mx-auto py-24 px-6">
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300 mb-6">
            Resources
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Master the <span className="text-red-600">Algorithm</span>
          </h1>
          <p className="mt-4 text-white/50 text-lg max-w-2xl">
            Free guides and strategies to help you build a high-performance YouTube channel.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                <article className="h-full border border-white/10 p-8 rounded-3xl bg-[#1f1f1f] hover:border-red-500/30 transition-all duration-300 group-hover:-translate-y-1 shadow-2xl">
                  <div className="flex flex-col h-full">
                    <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-red-500 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-white/40 line-clamp-3 text-sm leading-relaxed mb-6 flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-red-500 text-sm font-semibold">
                      Read Guide 
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
              <p className="text-white/30 italic">No articles published yet. Use your Admin Dashboard to create your first post!</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}