import SectionHeading from "@/components/ui/SectionHeading";
import ToolCard from "@/components/tools/ToolCard";

const tools = [
  {
    title: "Title Generator",
    description:
      "Generate clickable YouTube titles from your video idea and seed keywords.",
    href: "/tools/titles",
  },
  {
    title: "Tag Generator",
    description:
      "Create SEO-focused YouTube tags quickly from your topic or keywords.",
    href: "/tools/tags",
  },
  {
    title: "Description Generator",
    description:
      "Generate an optimized YouTube description built around keyword intent.",
    href: "/tools/descriptions",
    disabled: true,
  },
  {
    title: "Script Outline Generator",
    description:
      "Turn your video idea into a simple structure ready for recording.",
    href: "/tools/script-outline",
    disabled: true,
  },
  {
    title: "Keyword Finder",
    description:
      "Discover useful keyword opportunities to guide your title and metadata.",
    href: "/tools/keywords",
    disabled: true,
  },
  {
    title: "More Tools Coming",
    description:
      "More focused creator tools are on the way to help you build faster and smarter.",
    href: "/tools",
  },
];

export default function ToolsPreview() {
  return (
    <section className="relative px-4 py-12 md:px-6 md:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Quick tools"
          title="Jump straight into the tool you need."
          description="Built for creators who want titles, tags, descriptions and keyword help without being forced through one big workflow."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              href={tool.href}
              disabled={tool.disabled}
            />
          ))}
        </div>
      </div>
    </section>
  );
}