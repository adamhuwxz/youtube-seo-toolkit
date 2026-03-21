import Link from "next/link";
import { Wand2, Youtube, Twitter, Mail } from "lucide-react"; // Removed Github

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#0f0f0f] pt-16 pb-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0033] text-white shadow-lg shadow-red-950/40">
                <Wand2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">SEOTube</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/50 mb-6">
              The ultimate AI-powered toolkit for YouTube creators. Optimize your reach, automate your workflow, and dominate the algorithm.
            </p>
            <div className="flex gap-4">
              <Link href="https://twitter.com" className="text-white/30 hover:text-[#ff0033] transition-colors">
                <Twitter size={20} />
              </Link>
              <Link href="https://youtube.com" className="text-white/30 hover:text-[#ff0033] transition-colors">
                <Youtube size={20} />
              </Link>
              <Link href="mailto:hello@seotube.io" className="text-white/30 hover:text-[#ff0033] transition-colors">
                <Mail size={20} />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Product</h3>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/tools" className="hover:text-white transition-colors">AI Content Generator</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors">SEO Optimizer</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Resources & SEO Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Resources</h3>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/blog" className="hover:text-white transition-colors font-medium text-white/80">Growth Blog</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Video Guides</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">Support FAQ</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-white/30">
              © {currentYear} SEOTube. Built for the next generation of creators.
            </p>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
              Powered by OpenAI & Firebase
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[10px] text-green-500/60 uppercase font-bold tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}