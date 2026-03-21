import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, ChevronLeft } from "lucide-react";

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

  // Simple reading time calculation
  const words = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <article className="max-w-3xl mx-auto">
        
        {/* Breadcrumb Navigation */}
        <Link 
          href="/blog" 
          className="group flex items-center gap-2 text-white/40 hover:text-red-500 transition-colors mb-12 w-fit"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-wide uppercase">Back to Library</span>
        </Link>

        {/* Post Header */}
        <header className="mb-12 border-b border-white/10 pb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight text-balance">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              <span>{post.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Recently Published'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </header>

        {/* The Content Body */}
        {/* IMPORTANT: Ensure you have run 'npm install -D @tailwindcss/typography' 
          and added 'require("@tailwindcss/typography")' to your tailwind.config.ts 
        */}
        <div 
          className="prose prose-invert prose-red max-w-none 
          prose-headings:font-black prose-headings:tracking-tight 
          prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-lg
          prose-strong:text-white prose-a:no-underline prose-a:text-red-500 
          hover:prose-a:text-red-400 prose-img:rounded-3xl prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* Footer CTA */}
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-red-600/20 to-transparent border border-white/10">
          <h3 className="text-2xl font-bold mb-4 text-white">Dominate the Algorithm</h3>
          <p className="text-white/60 mb-6 leading-relaxed">
            Ready to stop guessing and start growing? Use our expert AI tools to optimize your videos in seconds.
          </p>
          <Link 
            href="/tools" 
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
          >
            Explore the Toolkit
          </Link>
        </div>
      </article>
    </main>
  );
}