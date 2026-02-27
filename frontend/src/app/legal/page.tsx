import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Legal
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        Terms and policies that govern use of MummyJ2Treats.
      </p>

      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Terms of Service</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mb-4">
            The terms under which you may use our platform, including ordering, selling, and delivery.
          </p>
          <Link
            href="/terms"
            className="inline-block text-primary font-medium hover:underline"
          >
            Read Terms →
          </Link>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Privacy Policy</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mb-4">
            How we collect, use, and protect your personal data when you use MummyJ2Treats.
          </p>
          <Link
            href="/privacy"
            className="inline-block text-primary font-medium hover:underline"
          >
            Read Privacy Policy →
          </Link>
        </section>
      </div>
    </div>
  );
}
