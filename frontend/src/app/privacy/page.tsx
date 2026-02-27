import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">1. Introduction</h2>
          <p>
            MummyJ2Treats (“we”, “our”, “the platform”) is committed to protecting your privacy. This policy describes how we collect, use, store, and protect personal information when you use our marketplace (website and services) as a customer, vendor, rider, or visitor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">2. Information we collect</h2>
          <p className="mb-2">We may collect:</p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1">
            <li><strong>Account data</strong> — Name, email, phone, password (stored securely, e.g. hashed), and role (customer, vendor, rider, admin).</li>
            <li><strong>Order and delivery data</strong> — Delivery address, location (if provided), order history, and payment-related identifiers (we do not store full card numbers; payments are processed by our payment provider).</li>
            <li><strong>Vendor and rider data</strong> — Business name, description, location, payout and delivery preferences, and availability where applicable.</li>
            <li><strong>Usage data</strong> — How you use the platform (e.g. pages visited, actions) to improve our service and analytics.</li>
            <li><strong>Newsletter</strong> — If you subscribe, we store your email for sending updates and marketing (you can opt out).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">3. How we use your information</h2>
          <p>
            We use your information to: provide and operate the platform; process orders and payments; manage vendor and rider accounts and assignments; communicate with you about orders and support; send newsletters (where consented); improve our services and security; and comply with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">4. Sharing and disclosure</h2>
          <p>
            We may share data with: <strong>payment providers</strong> (e.g. Paystack) to process payments; <strong>vendors and riders</strong> only as needed to fulfill and deliver your orders; <strong>service providers</strong> that help us run the platform (hosting, analytics), under strict confidentiality; and <strong>authorities</strong> when required by law. We do not sell your personal information to third parties for their marketing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">5. Security</h2>
          <p>
            We use industry-standard measures (e.g. encryption, secure authentication, access controls) to protect your data. Passwords are hashed; payment details are handled by our payment provider. Despite our efforts, no system is 100% secure; we encourage you to keep your account credentials safe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">6. Your rights</h2>
          <p>
            Depending on applicable law, you may have the right to access, correct, delete, or restrict use of your personal data, or to object to processing. You can update account details in your dashboard and unsubscribe from marketing emails. For other requests, contact us via Support or Help.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">7. Cookies and similar tech</h2>
          <p>
            We use cookies and similar technologies for authentication, session management, and improving the site. You can adjust browser settings to limit cookies, though some features may not work fully without them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">8. Changes to this policy</h2>
          <p>
            We may update this privacy policy. The “Last updated” date at the top will change. Continued use after changes constitutes acceptance. For material changes, we will aim to notify you where appropriate.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">9. Contact</h2>
          <p>
            For privacy-related questions or requests, use the Support or Help pages.
          </p>
        </section>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/legal" className="text-primary hover:underline">← Back to Legal</Link>
      </p>
    </div>
  );
}
