"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Lock } from "lucide-react";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
};

export default function ToolCard({
  title,
  description,
  href,
  disabled = false,
}: ToolCardProps) {
  const content = (
    <div
      className={`flex h-full flex-col justify-between rounded-3xl border p-6 transition ${
        disabled
          ? "border-white/10 bg-[#1f1f1f] opacity-75"
          : "border-white/10 bg-[#1f1f1f] hover:border-red-500/30 hover:bg-[#242424]"
      }`}
    >
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
          {disabled && <Lock className="h-3.5 w-3.5" />}
          {disabled ? "Coming Soon" : "Tool"}
        </div>

        <h3 className="text-lg font-semibold text-white">{title}</h3>

        <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
      </div>

      <div
        className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${
          disabled ? "text-white/45" : "text-red-300"
        }`}
      >
        {disabled ? "Not available yet" : "Open tool"}
        {!disabled && (
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      whileHover={!disabled ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className="group h-full"
    >
      {disabled ? (
        content
      ) : (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      )}
    </motion.div>
  );
}