import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Help
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        Get help with ordering, selling, or using MummyJ2Treats.
      </p>
      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Get support</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mb-4">
            Need help with an order, your vendor account, or a technical issue? Our support team can assist you.
          </p>
          <Link href="/support" className="inline-block text-primary font-medium hover:underline">
            Go to Support →
          </Link>
        </section>
        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">FAQs</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mb-4">
            Find answers to common questions about ordering, payments, delivery, and becoming a vendor or rider.
          </p>
          <Link href="/faqs" className="inline-block text-primary font-medium hover:underline">
            View FAQs →
          </Link>
        </section>
        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">How MummyJ2Treats works</h2>
          <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
            <li><strong>Customers</strong> — Register, browse products, add to cart, pay online (Paystack), and receive orders at your delivery address.</li>
            <li><strong>Vendors</strong> — Sign up, get approved by admin, add products, receive orders, and manage your store.</li>
            <li><strong>Riders</strong> — Register to deliver orders; vendors and admin can assign you to orders in your area.</li>
          </ul>
          <p className="mt-4 text-sm text-zinc-500">
            <Link href="/about" className="text-primary hover:underline">About MummyJ2Treats</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
