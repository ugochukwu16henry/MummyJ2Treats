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
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm">
              <Link href="#shop" className="hover:text-amber-700">Shop</Link>
              <Link href="#how-it-works" className="hover:text-amber-700">How it works</Link>
              <Link href="#help" className="hover:text-amber-700">Help</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-amber-700"
              >
                Sign up
              </Link>
              <Link
                href="/cart"
                className="relative inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-amber-50 transition-colors"
              >
                <span className="mr-1.5">
                  🛒
                </span>
                <span>Cart</span>
              </Link>
            </div>
          </div>
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
            <div className="relative w-full max-w-lg rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              <img
                src="/mummy j banner.jpeg"
                alt="MummyJ2Treats banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Shop treats</h2>
          <span className="text-xs text-neutral-500">
            Powered by your .NET JSON API at <code className="font-mono">{API_BASE}</code>
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Example product card using the \"soft glass\" style */}
          <div className="max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="relative h-64 bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587"
                alt="Chocolate Cake"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Popular
              </span>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-800">Double Choco Delight</h3>
                <span className="text-lg font-bold text-pink-600">₦15,000</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Rich, moist chocolate layers with Belgian ganache. Perfect for celebrations.
              </p>

              <div className="flex gap-2 mb-6">
                <button className="px-3 py-1 border border-gray-200 rounded-md text-xs hover:bg-pink-50">
                  Small
                </button>
                <button className="px-3 py-1 border border-pink-500 bg-pink-50 rounded-md text-xs text-pink-600 font-medium">
                  Standard (1kg)
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded-md text-xs hover:bg-pink-50">
                  Large
                </button>
              </div>

              <button
                type="button"
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-pink-600 transition-colors flex justify-center items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
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

