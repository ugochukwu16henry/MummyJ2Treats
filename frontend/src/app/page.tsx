import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5134/api";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Use the logo already added at project root; copy it into /public before deploy */}
            <img
              src="/mummyj2logo.png"
              alt="MummyJ2Treats"
              className="h-10 w-auto rounded-lg shadow-sm"
            />
            <div>
              <div className="font-semibold text-lg tracking-tight">MummyJ2Treats</div>
              <div className="text-xs text-neutral-500">Homemade treats from my kitchen to yours</div>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="#shop" className="hover:text-amber-700">Shop</Link>
            <Link href="#how-it-works" className="hover:text-amber-700">How it works</Link>
            <Link href="#help" className="hover:text-amber-700">Help</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-amber-50 to-white border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Fresh, homemade treats
              <br />
              from my kitchen to your door.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Order small chops, cakes, and desserts directly from MummyJ2Treats.
              I bake every order fresh and arrange delivery across Lagos.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="#shop"
                className="inline-flex items-center justify-center rounded-full bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-800 transition-colors"
              >
                Shop treats
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-amber-700 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                How it works
              </Link>
            </div>
            <p className="text-xs text-neutral-500">
              Bank transfer checkout • Upload receipt • I confirm and you get a digital PDF receipt.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="h-56 w-56 sm:h-72 sm:w-72 rounded-3xl bg-[url('/mummyj2logo.png')] bg-cover bg-center shadow-2xl border border-white/60" />
          </div>
        </div>
      </section>

      <section id="shop" className="max-w-6xl mx-auto px-4 py-10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Shop treats</h2>
          <span className="text-xs text-neutral-500">
            Data is loaded from the .NET JSON API at <code className="font-mono">{API_BASE}</code>
          </span>
        </div>
        <p className="text-sm text-neutral-600">
          This section will list categories and products from your JSON-powered .NET backend.
          Once the API is deployed, the frontend will fetch <code className="font-mono">/products</code> and{" "}
          <code className="font-mono">/categories</code> and render them here.
        </p>
      </section>

      <section
        id="how-it-works"
        className="border-y border-neutral-200 bg-white mt-6"
      >
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
            How ordering works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3 text-center text-sm">
            <div className="space-y-2">
              <div className="text-3xl">🛒</div>
              <div className="font-semibold">Browse &amp; add to cart</div>
              <p className="text-neutral-600">
                Pick your favourites and add them to your cart on the website.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🏦</div>
              <div className="font-semibold">Pay by bank transfer</div>
              <p className="text-neutral-600">
                At checkout you&apos;ll see bank details and upload your transfer receipt.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">📄</div>
              <div className="font-semibold">Approval &amp; PDF receipt</div>
              <p className="text-neutral-600">
                I confirm your payment in the admin dashboard and the system generates a PDF receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="help"
        className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-neutral-600"
      >
        <h2 className="text-base font-semibold mb-2">Need help?</h2>
        <p className="mb-3">
          If you have any questions about your order, receipts, or delivery, these pages will guide you:
        </p>
        <p className="space-x-2">
          <Link href="/help" className="underline hover:text-amber-700">Help</Link>
          <span>·</span>
          <Link href="/support" className="underline hover:text-amber-700">Support</Link>
          <span>·</span>
          <Link href="/faqs" className="underline hover:text-amber-700">FAQs</Link>
          <span>·</span>
          <Link href="/legal" className="underline hover:text-amber-700">Legal</Link>
          <span>·</span>
          <Link href="/terms" className="underline hover:text-amber-700">Terms</Link>
          <span>·</span>
          <Link href="/privacy" className="underline hover:text-amber-700">Privacy</Link>
        </p>
      </section>

      <footer className="mt-8 border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} MummyJ2Treats. All rights reserved.
      </footer>
    </main>
  );
}

