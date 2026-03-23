"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Search, Calendar, ArrowRight, Sparkles, Loader2, X } from "lucide-react";

// 1. Define the Interface
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  createdAt?: Timestamp;
  published?: boolean;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Fetch data from Firestore on Mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        const postsCollection = collection(db, "posts");
        // Note: This requires a Firestore Index. If it fails, 
        // check your browser console for the direct link to create it.
        const postsQuery = query(postsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(postsQuery);
        
        const fetchedPosts: BlogPost[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as BlogPost));

        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // 3. Handle Local Search Filtering
  useEffect(() => {
    const term = searchQuery.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(term) || 
      post.excerpt.toLowerCase().includes(term)
    );
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <section className="max-w-6xl mx-auto">
        
        {/* Header & Search Bar */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-6">
              <Sparkles className="w-4 h-4" />
              Resources
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              Master the <span className="text-red-600">Algorithm</span>
            </h1>
            <p className="mt-4 text-white/50 text-lg leading-relaxed">
              Expert strategies and algorithm deep-dives to help you build a high-performance YouTube channel.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-10 outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                <article className="h-full border border-white/10 p-8 rounded-[2.5rem] bg-white/[0.03] hover:bg-white/[0.06] hover:border-red-500/30 transition-all duration-500 group-hover:-translate-y-2 shadow-2xl flex flex-col">
                  
                  {/* Date Tag */}
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {post.createdAt?.toDate ? 
                        post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                        'Draft'}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black mb-4 text-white group-hover:text-red-500 transition-colors leading-tight">
                    {post.title}
                  </h2>
                  
                  <p className="text-white/40 line-clamp-3 text-sm leading-relaxed mb-8 flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center text-red-500 text-sm font-bold group-hover:gap-4 transition-all gap-2">
                    Read Guide 
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-24 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
              <p className="text-white/30 text-lg font-medium">
                {searchQuery ? `No guides found for "${searchQuery}"` : "The library is currently being updated."}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-red-500 font-bold hover:underline"
                >
                  View all articles
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}