export const metadata = {
  title: "Terms of Service | SEOTube",
  description: "The rules and guidelines for using the SEOTube platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-24 px-6">
      <article className="max-w-3xl mx-auto prose prose-invert prose-red">
        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        <p className="text-gray-400">Effective Date: March 21, 2026</p>

        <section className="mt-12">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing SEOTube.io, you agree to be bound by these Terms of Service. If you do not agree, please do not use our tools.
          </p>
        </section>

        <section>
          <h2>2. Use of AI Tools</h2>
          <p>
            SEOTube provides AI-generated content. While we strive for high-quality SEO output, we do not guarantee search engine rankings. You are responsible for reviewing all AI-generated content before publishing it.
          </p>
        </section>

        <section>
          <h2>3. Credits and Payments</h2>
          <p>
            Credits purchased on SEOTube are non-refundable unless otherwise required by law. Credits do not expire as long as your account remains active.
          </p>
        </section>

        <section>
          <h2>4. Prohibited Conduct</h2>
          <p>
            Users may not use SEOTube to generate spam, illegal content, or engage in automated &quot;scraping&quot; of the platform that puts undue load on our infrastructure.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            SEOTube shall not be liable for any indirect, incidental, or consequential damages resulting from your use of our AI tools.
          </p>
        </section>
      </article>
    </main>
  );
}