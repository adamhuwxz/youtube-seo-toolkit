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
  Sparkles,
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
  status: "live" | "coming" | "advanced";
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
    description:
      "Create a clean list of SEO-focused YouTube tags in seconds.",
    icon: Tags,
    href: "/tools/tags",
    status: "live",
  },
  {
    name: "Description Generator",
    description:
      "Generate an SEO description using validated keyword intent.",
    icon: FileText,
    href: "/tools/descriptions",
    status: "coming",
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
    status: "coming",
  },
  {
    name: "Full SEO Pack",
    description:
      "Generate titles, tags, description and script outline together.",
    icon: Sparkles,
    href: "/workflow",
    status: "advanced",
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
      <main className="min-h-screen bg-[#050816] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-white/70">
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
          <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs text-green-300">
            Live
          </span>
        );
      case "coming":
        return (
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
            Coming Soon
          </span>
        );
      case "advanced":
        return (
          <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-200">
            Advanced
          </span>
        );
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="text-4xl font-semibold">Creator Tools</h1>

        <p className="mt-4 max-w-2xl text-white/65">
          Generate exactly what you need for your YouTube video without running
          a large workflow every time.
        </p>

        <div className="mt-8 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Faster workflow
          </p>

          <p className="mt-3 text-sm leading-7 text-cyan-100/85">
            Most creators only need one result at a time — titles, tags,
            descriptions or keywords. These tools keep things simple and fast.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            const content = (
              <div className="group rounded-[24px] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.07]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
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

                <div className="mt-6 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
                  {tool.status === "live" ? "Open tool" : "Not available yet"}
                </div>
              </div>
            );

            if (tool.status === "coming") {
              return (
                <div key={tool.name} className="relative opacity-70">
                  {content}

                  <div className="absolute right-5 top-5 text-white/40">
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