import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import ToolsPreview from "@/components/sections/ToolsPreview";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <Navbar />
      <Hero />
      <ToolsPreview />
      <Footer />
    </main>
  );
}