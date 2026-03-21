import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link"; // Added this import

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const q = query(collection(db, "posts"), where("slug", "==", slug));
  const snap = await getDocs(q);
  
  if (snap.empty) return { title: "Post Not Found" };
  const post = snap.docs[0].data();

  return {
    title: `${post.title} | SEOTube`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const q = query(collection(db, "posts"), where("slug", "==", slug));
  const snap = await getDocs(q);

  if (snap.empty) notFound();
  const post = snap.docs[0].data();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-20 px-6">
      <article className="max-w-3xl mx-auto">
        {/* FIXED: Changed <a> to <Link> */}
        <Link href="/blog" className="text-red-500 hover:text-red-400 text-sm mb-8 inline-block">
          ← Back to Blog
        </Link>

        <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
          {post.title}
        </h1>

        <div 
          className="prose prose-invert prose-red max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>
    </main>
  );
}