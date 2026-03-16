import SectionHeading from "@/components/ui/SectionHeading";
import ToolCard from "@/components/tools/ToolCard";

const tools = [
  {
    title: "Transcript Extractor",
    description: "Paste a YouTube URL and pull the transcript only.",
    href: "/tools/transcript-extractor",
  },
  {
    title: "Transcript Cleaner",
    description: "Clean punctuation, spelling, and readability from a pasted transcript.",
    href: "/tools/transcript-cleaner",
  },
  {
    title: "ElevenLabs Formatter",
    description: "Turn rough text into a clean voiceover-ready script with subtle tone.",
    href: "/tools/elevenlabs-formatter",
  },
  {
    title: "Description Generator",
    description: "Generate an optimized YouTube description from keywords and transcript text.",
    href: "/tools/description-generator",
  },
  {
    title: "Tag Generator",
    description: "Create long-tail tags from your topic, title, or transcript.",
    href: "/tools/tag-generator",
  },
  {
    title: "Title Optimizer",
    description: "Improve your title with stronger SEO and click appeal.",
    href: "/tools/title-optimizer",
  },
];

export default function ToolsPreview() {
  return (
    <section className="relative px-6 py-20 md:py-28">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Quick tools"
          title="Use the full workflow or jump straight into one tool."
          description="Perfect for creators who already have part of the process done and just want the next step."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}