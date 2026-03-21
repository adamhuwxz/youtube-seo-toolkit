import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | SEOTube",
  description: "How we handle and protect your data at SEOTube.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white py-24 px-6">
      <article className="max-w-3xl mx-auto prose prose-invert prose-red">
        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
        <p className="text-gray-400">Last Updated: March 2026</p>

        <section className="mt-12">
          <h2>1. Information We Collect</h2>
          <p>
            When you use SEOTube, we collect information you provide directly to us, such as your email address when you create an account via Firebase Authentication.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our AI SEO tools.</li>
            <li>Process your credit balance and subscriptions.</li>
            <li>Send technical notices and support messages.</li>
          </ul>
        </section>

        <section>
          <h2>3. AI and Data Processing</h2>
          <p>
            Our blog generation and SEO tools utilize the OpenAI API. While we send your keywords to OpenAI to generate content, we do not share your personal identity or email with third-party AI providers.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We use industry-standard encryption and Firebase Security Rules to ensure that your data is only accessible to you. We do not store credit card information on our servers; all payments are handled by our secure payment processor.
          </p>
        </section>

        <div className="mt-12 p-8 bg-white/5 rounded-3xl border border-white/10 text-center">
          <p className="text-sm text-gray-400">Questions about your privacy?</p>
          <Link href="mailto:support@seotube.io" className="text-red-500 font-bold">Contact Support</Link>
        </div>
      </article>
    </main>
  );
}