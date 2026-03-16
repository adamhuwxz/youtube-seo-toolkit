"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function ToolCard({ title, description, href }: ToolCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group h-full"
    >
      <Link
        href={href}
        className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#1f1f1f] p-6 transition hover:border-red-500/40 hover:bg-[#242424]"
      >
        <div>
          <div className="mb-4 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            Tool
          </div>

          <h3 className="text-lg font-semibold text-white">{title}</h3>

          <p className="mt-3 text-sm leading-6 text-white/60">
            {description}
          </p>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/85">
          Open Tool
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}