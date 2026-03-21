"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export default function AdminBlogPage() {
  const [keywords, setKeywords] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [post, setPost] = useState<BlogPost | null>(null);

  async function generateBlogPost() {
    if (!keywords) return alert("Please enter at least one keyword");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        body: JSON.stringify({ keywords }),
      });
      const data: BlogPost = await res.json();
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
    } catch (error) {
      console.error("Firestore Error:", error);
      alert("Error saving to Firestore");
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Blog Generator</h1>
        
        <div className="flex gap-4 mb-10">
          <input 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-red-500/50"
            placeholder="e.g., YouTube Shorts Strategy 2026, Viral Hooks"
          />
          <button 
            onClick={generateBlogPost}
            disabled={isGenerating}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-8 py-4 rounded-2xl font-bold transition"
          >
            {isGenerating ? "AI is writing..." : "Generate Post"}
          </button>
        </div>

        {post && (
          <div className="border border-white/10 rounded-3xl bg-[#1a1a1a] p-8 shadow-2xl">
            <div className="mb-6 pb-6 border-b border-white/10">
              <p className="text-red-500 text-sm font-bold uppercase mb-2">Draft Preview</p>
              <h2 className="text-3xl font-bold">{post.title}</h2>
              <p className="text-white/40 mt-2 italic">Slug: /blog/{post.slug}</p>
            </div>

            <div 
              className="prose prose-invert prose-red max-w-none mb-10"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />

            <button 
              onClick={publishToFirebase} 
              className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-bold transition"
            >
              Confirm and Publish to SEOTube.io
            </button>
          </div>
        )}
      </div>
    </main>
  );
}