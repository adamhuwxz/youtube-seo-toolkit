"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Wand2, ShieldCheck, Send, Sparkles } from "lucide-react";

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export default function AdminBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [keywords, setKeywords] = useState<string>("");
  const [extraInstructions, setExtraInstructions] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [post, setPost] = useState<BlogPost | null>(null);

  // SECURITY: Only allow support@seotube.io
  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== "support@seotube.io") {
        router.push("/"); 
      }
    }
  }, [user, loading, router]);

  async function generateBlogPost() {
    if (!keywords) return alert("Please enter at least one keyword");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, extraInstructions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPost(data);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate blog. Check console.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function publishToFirebase() {
    if (!post) return;
    try {
      await addDoc(collection(db, "posts"), {
        ...post,
        createdAt: serverTimestamp(),
        published: true,
      });
      alert("Post Published Successfully!");
      setPost(null);
      setKeywords("");
      setExtraInstructions("");
    } catch (error) {
      console.error("Firestore Error:", error);
      alert("Error saving to Firestore");
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Verifying Admin Status...</div>;
  if (!user || user.email !== "support@seotube.io") return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Console</h1>
            <p className="text-white/40 text-sm uppercase tracking-widest font-bold mt-1">AI Blog Command Center</p>
          </div>
        </div>
        
        {/* Generator Controls */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-12 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase ml-2 mb-2 block tracking-tighter">Target Keywords</label>
              <input 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-red-500/50 transition-all text-lg"
                placeholder="e.g., YouTube Shorts Algorithm 2026, Viral Retention"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/40 uppercase ml-2 mb-2 block tracking-tighter">Secret Sauce (Extra Context)</label>
              <textarea 
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                rows={3}
                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-red-500/50 transition-all resize-none text-white/80"
                placeholder="e.g., Focus on CTR, mention MrBeast's latest strategy, use a high-energy tone..."
              />
            </div>

            <button 
              onClick={generateBlogPost}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <span>AI is Crafting...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  <span>Generate Growth Post</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {post && (
          <div className="border border-white/10 rounded-[2.5rem] bg-[#111] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 pb-10 border-b border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Draft Preview</span>
              </div>
              <h2 className="text-4xl font-black leading-tight mb-4 tracking-tight">{post.title}</h2>
              <code className="text-white/30 text-xs bg-black/40 px-3 py-2 rounded-lg">Slug: seotube.io/blog/{post.slug}</code>
            </div>

            <div 
              className="prose prose-invert prose-red max-w-none mb-12 prose-p:text-white/60 prose-headings:text-white prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />

            <button 
              onClick={publishToFirebase} 
              className="w-full bg-green-600 hover:bg-green-500 py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 group"
            >
              <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Publish to SEOTube.io
            </button>
          </div>
        )}
      </div>
    </main>
  );
}