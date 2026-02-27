import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Support
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        We’re here to help with orders, accounts, and any issues.
      </p>

      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Order issues</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
            For questions about an order (status, delivery, refunds), log in and check <strong>My orders</strong> in your dashboard. Support tickets can be raised for specific orders and are managed by our team.
          </p>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Vendor & rider support</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
            Vendors and riders can access their dashboards to manage products, orders, and delivery. If you need account approval or technical help, contact us via the channels below.
          </p>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Contact</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mb-2">
            For general support and partnership inquiries:
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
            <li>Use the <strong>FAQs</strong> page for quick answers.</li>
            <li>Logged-in users can raise support tickets from the founder admin area for order-related issues.</li>
            <li>Email or contact details can be added here when you set them up.</li>
          </ul>
          <p className="mt-4">
            <Link href="/faqs" className="text-primary font-medium hover:underline">View FAQs</Link>
            {" · "}
            <Link href="/help" className="text-primary font-medium hover:underline">Back to Help</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
