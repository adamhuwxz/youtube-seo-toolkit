"use client";

import { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Type,
  Tags,
  FileText,
  ListOrdered,
  Search,
  Lock,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/components/providers/AuthProvider";

type Tool = {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: "live" | "coming";
};

const tools: Tool[] = [
  {
    name: "Title Generator",
    description:
      "Generate clickable YouTube titles from a video idea and seed keywords.",
    icon: Type,
    href: "/tools/titles",
    status: "live",
  },
  {
    name: "Tag Generator",
    description: "Create a clean list of SEO-focused YouTube tags in seconds.",
    icon: Tags,
    href: "/tools/tags",
    status: "live",
  },
  {
    name: "Description Generator",
    description:
      "Use your top keyword from the Tags tool to generate accurate, SEO-focused YouTube descriptions.",
    icon: FileText,
    href: "/tools/descriptions",
    status: "live",
  },
  {
    name: "Script Outline Generator",
    description:
      "Turn a video idea into a simple outline ready for recording.",
    icon: ListOrdered,
    href: "/tools/script-outline",
    status: "coming",
  },
  {
    name: "Keyword Finder",
    description:
      "Find strong keyword opportunities ranked by search demand.",
    icon: Search,
    href: "/tools/keywords",
    status: "live",
  },
];

export default function ToolsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 text-white/70">
            Checking account...
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  function getStatusBadge(status: Tool["status"]) {
    switch (status) {
      case "live":
        return (
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300">
            Live
          </span>
        );
      case "coming":
        return (
          <span className="rounded-full border border-white/10 bg-[#121212] px-3 py-1 text-xs font-medium text-white/50">
            Coming Soon
          </span>
        );
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
        </div>

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            Creator Tools
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
            Focused tools for faster YouTube SEO
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-white/60 md:text-base">
            Generate exactly what you need for your video with individual tools
            for titles, tags, descriptions, outlines and keyword research.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
            Built for speed
          </p>

          <p className="mt-3 text-sm leading-7 text-white/75">
            Most creators do not need one giant workflow every time. These tools
            are designed to help you move faster, stay focused and generate only
            the parts you actually need.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            const content = (
              <div className="group rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 transition hover:border-red-500/30 hover:bg-[#242424]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      {tool.name}
                    </h2>

                    {getStatusBadge(tool.status)}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/65">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6 text-sm font-medium text-red-300 transition group-hover:text-red-200">
                  {tool.status === "live" ? "Open tool" : "Not available yet"}
                </div>
              </div>
            );

            if (tool.status === "coming") {
              return (
                <div key={tool.name} className="relative opacity-75">
                  {content}

                  <div className="absolute right-5 top-5 text-white/35">
                    <Lock size={16} />
                  </div>
                </div>
              );
            }

            return (
              <Link key={tool.name} href={tool.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}