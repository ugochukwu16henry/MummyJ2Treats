
import Image from "next/image";
import { TestimonialForm } from "./_components/TestimonialForm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const PRIMARY_VENDOR_SLUG =
  process.env.NEXT_PUBLIC_PRIMARY_VENDOR_SLUG ?? "mummyj2treats";

async function fetchHomeProducts() {
  try {
    const res = await fetch(
      `${API_BASE}/products?vendorSlug=${PRIMARY_VENDOR_SLUG}&limit=8`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchRankedVendors() {
  try {
    const res = await fetch(`${API_BASE}/moat/vendors/ranked?limit=6`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchRecommendations() {
  try {
    const res = await fetch(`${API_BASE}/moat/recommendations?limit=4`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchFounderTestimonials() {
  try {
    const res = await fetch(`${API_BASE}/testimonials/founder?limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [bestSellers, rankedVendors, recommendations, testimonials] = await Promise.all([
    fetchHomeProducts(),
    fetchRankedVendors(),
    fetchRecommendations(),
    fetchFounderTestimonials(),
  ]);

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans dark:bg-black">
      {/* Announcement Bar */}
      <div className="h-10 flex items-center justify-center bg-[#1E1E2F] text-white text-sm font-medium">
        Fresh homemade treats delivered in Uyo 🚚
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
          <Image src="/mummyj2logo.png" alt="MummyJ2Treats Logo" width={64} height={64} />
          <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">MummyJ2Treats</span>
        </div>
        <div className="hidden md:flex gap-4 sm:gap-6 text-base font-medium">
          <a href="/" className="hover:text-primary">Home</a>
          <a href="/dashboard/vendor" className="hover:text-primary">Vendors</a>
          <a href="#categories" className="hover:text-primary">Categories</a>
          <a href="/about" className="hover:text-primary">About</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="hidden md:block"><span className="material-icons">search</span></button>
          <a href="/auth/login" className="text-sm font-medium">Login</a>
          <a href="/cart" className="relative">
            <span className="material-icons">shopping_cart</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 sm:gap-8 px-4 py-12 sm:py-20 md:py-24 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
        <div className="flex-1 flex flex-col gap-4 sm:gap-6 items-start">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold leading-tight text-zinc-900 dark:text-white">Bringing Homemade Excellence to Your Table</h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300">Order delicious, trusted homemade meals from Uyo’s best home cooks and caterers.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 w-full">
            <a href="#best-sellers" className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-lg shadow hover:bg-primary/90 text-center">
              Order Now
            </a>
            <a
              href="/dashboard/vendor"
              className="bg-white border border-primary text-primary px-6 py-3 rounded-full font-semibold text-lg hover:bg-primary/10 text-center"
            >
              Become a Vendor
            </a>
            <a
              href="/auth/register/rider"
              className="bg-white border border-amber-500 text-amber-600 px-6 py-3 rounded-full font-semibold text-lg hover:bg-amber-50 text-center"
            >
              Become a Rider
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Image src="/hero-food.png" alt="Food Spread" width={320} height={240} className="rounded-2xl shadow-xl object-cover w-full max-w-xs sm:max-w-md md:max-w-lg" />
        </div>
      </section>

      {/* Category Grid */}
      <section id="categories" className="py-8 sm:py-12 px-2 sm:px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {[1,2,3,4,5,6,7,8].map((cat) => (
            <div key={cat} className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3" />
              <span className="font-medium">Category {cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated Vendors (Data Moat: smart ranking) */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Top Rated Vendors</h2>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2">
          {rankedVendors.length === 0 ? (
            <p className="text-zinc-600">No vendor data yet. Orders will drive our smart ranking.</p>
          ) : (
            rankedVendors.map((v: { vendorId: string; businessName: string; slug: string; fulfillmentRate: number }) => (
              <a
                key={v.vendorId}
                href={v.slug ? `/vendor/${v.slug}` : "#"}
                className="min-w-[220px] rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2 flex items-center justify-center text-lg font-bold text-primary">
                  {v.businessName?.slice(0, 1) ?? "V"}
                </div>
                <span className="font-semibold text-center line-clamp-1">{v.businessName}</span>
                <span className="text-amber-500 text-sm">{Math.round(v.fulfillmentRate)}% delivered</span>
                <span className="mt-2 px-4 py-1 bg-primary text-white rounded-full text-sm">View Store</span>
              </a>
            ))
          )}
                       <a href="/vendor" className="hover:text-primary">Vendors</a>
      </section>

      {/* Recommended for you (Data Moat: recommendations) */}
      {recommendations.length > 0 && (
        <section className="py-8 sm:py-12 px-2 sm:px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Recommended for you</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendations.map((p: { productId: string; name: string; slug: string; vendorSlug: string; price: number }) => (
              <a
                key={p.productId}
                href={p.vendorSlug ? `/vendor/${p.vendorSlug}#${p.slug}` : "/"}
                className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
              >
                <span className="font-semibold line-clamp-2 text-center">{p.name}</span>
                <span className="font-bold text-lg mt-1">₦{Number(p.price).toLocaleString()}</span>
              </a>
            ))}
          </div>
        </section>
      )}

                         <a
                           href="/vendor/signup"
                           className="bg-white border border-primary text-primary px-6 py-3 rounded-full font-semibold text-lg hover:bg-primary/10 text-center"
                         >
                           Become a Vendor
                         </a>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
              >
                <div className="w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {/* Placeholder for product image */}
                  <span className="text-xs text-zinc-500">Product image</span>
                </div>
                <span className="font-semibold line-clamp-2 text-center">
                  {p.name}
                </span>
                <span className="text-sm text-zinc-500">
                  {p.vendor_name ?? "Vendor"}
                </span>
                <span className="font-bold text-lg mt-1">
                  ₦{Number(p.price).toLocaleString()}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await fetch(`${API_BASE}/cart/items`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                           <li><a href="/vendor/signup">Become a Vendor</a></li>
                      body: JSON.stringify({ productId: p.id, quantity: 1 }),
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="mt-2 px-4 py-1 bg-primary text-white rounded-full text-sm"
                  >
                    Add to cart
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 justify-center items-center">
          {[
            { icon: "🛒", label: "Browse" },
            { icon: "📦", label: "Order" },
            { icon: "🚚", label: "Delivered" },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-4xl mb-2">{step.icon}</div>
              <span className="font-medium text-lg">{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Testimonials</h2>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2">
          {testimonials.length === 0 ? (
            <p className="text-zinc-600 mx-auto text-center">
              Testimonials will appear here after the founder approves them.
            </p>
          ) : (
            testimonials.map((t: any) => (
              <div
                key={t.id}
                className="min-w-[320px] rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-6 flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden flex items-center justify-center">
                  {t.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image_url} alt="Customer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-zinc-500">Customer</span>
                  )}
                </div>
                <p className="italic text-zinc-600 dark:text-zinc-300 mb-2 text-center">
                  “{t.content}”
                </p>
                <span className="font-semibold">
                  {t.first_name ? `${t.first_name} ${t.last_name ?? ""}`.trim() : "Customer"}
                </span>
              </div>
            ))
          )}
        </div>
        <TestimonialForm target="founder" />
      </section>

      {/* Newsletter */}
      <section className="py-8 sm:py-12 px-2 sm:px-4 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Get the best homemade treats in your inbox</h2>
        <form className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <label htmlFor="newsletter-email" className="sr-only">Your email for newsletter</label>
          <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Your email" className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 focus:outline-none w-full sm:w-auto" aria-label="Your email for newsletter" />
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full font-semibold w-full sm:w-auto">Subscribe</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-8 sm:py-12 px-2 sm:px-4 mt-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          <div>
            <h3 className="font-bold mb-2">Company</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="/about">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Vendors & Riders</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="/dashboard/vendor">Become a Vendor</a></li>
              <li><a href="/dashboard/vendor">Vendor Dashboard</a></li>
              <li><a href="/auth/register/rider">Become a Rider</a></li>
              <li><a href="/dashboard/rider">Rider Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Help</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#">Support</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Legal</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Twitter"><span className="material-icons">twitter</span></a>
              <a href="#" aria-label="Instagram"><span className="material-icons">instagram</span></a>
              <a href="#" aria-label="Facebook"><span className="material-icons">facebook</span></a>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-zinc-400 mt-8">© {new Date().getFullYear()} MummyJ2Treats. All rights reserved.</div>
      </footer>
    </div>
  );
}
