import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Terms of Service
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">1. Acceptance</h2>
          <p>By using MummyJ2Treats you agree to these Terms. The platform is a digital marketplace connecting customers with verified homemade food vendors. If you do not agree, do not use the platform.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">2. Use of the platform</h2>
          <p>You may use the platform as a customer (order, pay, receive delivery), vendor (sell products, manage orders, subject to admin approval), or rider (deliver orders as assigned). You must provide accurate information and use the service lawfully.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">3. Orders and payments</h2>
          <p>Orders are binding once payment is confirmed. We use secure payment providers (e.g. Paystack). Prices and delivery fees are as shown at checkout. Refunds and cancellations follow our policies and applicable law.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">4. Vendors and riders</h2>
          <p>Vendors must be approved by the platform before selling and are responsible for their products and orders. Riders must comply with assignment and delivery guidelines. We may suspend or remove accounts that breach these terms.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">5. Limitation of liability</h2>
          <p>The platform is provided as is. We are not liable for indirect or consequential damages arising from your use or orders placed through the platform, to the extent permitted by law.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">6. Contact</h2>
          <p>For questions about these terms, use the Support or Help pages.</p>
        </section>
      </div>
      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/legal" className="text-primary hover:underline">← Back to Legal</Link>
      </p>
    </div>
  );
}
