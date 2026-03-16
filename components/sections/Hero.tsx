"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-600/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-4 py-2 text-sm text-white/75">
            <Sparkles className="h-4 w-4 text-red-400" />
            AI workflow + quick tools
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
            Turn a YouTube URL into a full SEO and content pack.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
            Paste a YouTube URL and generate transcript cleanup, titles,
            descriptions, tags, and voiceover-ready scripts — or jump straight
            into individual tools.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="/workflow"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff0033] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d]"
            >
              Open Full Workflow
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/tools"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-[#1f1f1f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
            >
              Browse Tools
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative"
        >
          <div className="rounded-[28px] border border-white/10 bg-[#1f1f1f] p-5 shadow-2xl">
            <div className="rounded-[24px] border border-white/10 bg-[#121212] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">Full Workflow</p>
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                  Fast start
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
                <p className="mb-2 text-sm text-white/50">YouTube URL</p>
                <div className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white/70">
                  https://youtube.com/watch?v=example
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Transcript",
                  "Clean Script",
                  "Keywords",
                  "Description",
                  "Tags",
                  "Title Ideas",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}