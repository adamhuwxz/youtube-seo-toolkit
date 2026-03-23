"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Wand2, ShieldCheck, Send, Sparkles, Plus, Trash2 } from "lucide-react";

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export default function AdminBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [keywordList, setKeywordList] = useState<string[]>([""]);
  const [extraInstructions, setExtraInstructions] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [post, setPost] = useState<BlogPost | null>(null);

  const addKeywordField = () => setKeywordList([...keywordList, ""]);
  const removeKeywordField = (index: number) => {
    const newList = keywordList.filter((_, i) => i !== index);
    setKeywordList(newList.length ? newList : [""]);
  };
  const updateKeywordValue = (index: number, value: string) => {
    const newList = [...keywordList];
    newList[index] = value;
    setKeywordList(newList);
  };

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== "support@seotube.io") {
        router.push("/"); 
      }
    }
  }, [user, loading, router]);

  async function generateBlogPost() {
    const validKeywords = keywordList.filter(k => k.trim() !== "");
    if (validKeywords.length === 0) return alert("Please enter at least one keyword");
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: validKeywords, extraInstructions }),
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
      setKeywordList([""]);
      setExtraInstructions("");
    } catch (error) {
      console.error("Firestore Error:", error);
      alert("Error saving to Firestore");
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white font-bold">Verifying Admin...</div>;
  if (!user || user.email !== "support@seotube.io") return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Console</h1>
            <p className="text-white/40 text-sm uppercase tracking-widest font-bold mt-1">AI Blog Command Center</p>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-12 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase ml-2 mb-3 block tracking-tighter">Target SEO Keywords</label>
              <div className="space-y-3">
                {keywordList.map((kw, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      value={kw}
                      onChange={(e) => updateKeywordValue(index, e.target.value)}
                      className="flex-1 p-4 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-red-500/50 transition-all text-white"
                      placeholder={index === 0 ? "Primary Keyword" : "Secondary Keyword"}
                    />
                    {keywordList.length > 1 && (
                      <button type="button" onClick={() => removeKeywordField(index)} className="p-4 bg-red-900/10 hover:bg-red-900/30 border border-red-900/20 rounded-xl text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addKeywordField} className="mt-4 flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 transition-colors ml-2">
                <Plus className="w-4 h-4" /> Add Related Keyword
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-white/40 uppercase ml-2 mb-2 block tracking-tighter">The &quot;Answer&quot; Prompt (Extra Context)</label>
              <textarea 
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                rows={4}
                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-red-500/50 transition-all resize-none text-white/80"
                placeholder="Give the AI specific answers to provide. (e.g. &apos;Explain that 2026 views come from AVD over CTR&apos;)"
              />
            </div>

            <button onClick={generateBlogPost} disabled={isGenerating} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20">
              {isGenerating ? <><Sparkles className="w-6 h-6 animate-pulse" /><span>Researcher is Mining Data...</span></> : <><Wand2 className="w-6 h-6" /><span>Generate Authority Article</span></>}
            </button>
          </div>
        </div>

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
            <div className="prose prose-invert prose-red max-w-none mb-12 prose-p:text-white/60 prose-headings:text-white prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            <button onClick={publishToFirebase} className="w-full bg-green-600 hover:bg-green-500 py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 group">
              <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />Confirm and Push to Production
            </button>
          </div>
        )}
      </div>
    </main>
  );
}