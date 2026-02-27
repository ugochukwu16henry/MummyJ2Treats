
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
import { TestimonialForm } from "../../_components/TestimonialForm";

async function fetchVendorStore(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/vendor/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { vendor: null, products: [] as any[] };
    }
    const json = await res.json();
    const products: any[] = json.data ?? [];
    if (!products.length) {
      return { vendor: null, products: [] };
    }
    const first = products[0];
    const vendor = {
      name: first.vendor_name as string,
      slug: first.vendor_slug as string,
      logoUrl: first.vendor_logo_url as string | null,
      bannerUrl: first.vendor_banner_url as string | null,
    };
    return { vendor, products };
  } catch {
    return { vendor: null, products: [] };
  }
}

async function fetchVendorTestimonials(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/testimonials/vendor/${slug}?limit=8`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function VendorStorePage({
  params,
}: {
  params: { slug: string };
}) {
  const [store, testimonials] = await Promise.all([
    fetchVendorStore(params.slug),
    fetchVendorTestimonials(params.slug),
  ]);
  const { vendor, products } = store;

  if (!vendor) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
        <p className="text-zinc-600">
          This vendor either does not exist or has no active products yet.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans">
      {/* Hero / Banner reusing homepage style */}
      <section className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
        {vendor.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.bannerUrl}
            alt={`${vendor.name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto w-full px-4 pb-6 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center overflow-hidden">
              {vendor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vendor.logoUrl}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {vendor.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {vendor.name}
              </h1>
              <p className="text-sm text-zinc-100">
                Homemade treats from {vendor.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product grid, similar to homepage best sellers */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <h2 className="text-2xl font-bold mb-4">Menu</h2>
        {products.length === 0 ? (
          <p className="text-zinc-600">
            This vendor has no active products yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl shadow-md bg-white p-3 flex flex-col items-start hover:shadow-lg transition-shadow"
              >
                <div className="w-full aspect-[4/3] bg-zinc-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                  {/* Placeholder image area. Later we can use real product images. */}
                  <span className="text-sm text-zinc-500">Product image</span>
                </div>
                <span className="font-semibold text-sm sm:text-base line-clamp-2">
                  {p.name}
                </span>
                <span className="text-xs text-zinc-500 mb-1">
                  ₦{Number(p.price).toLocaleString()}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await fetch(`${API_BASE}/cart/items`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ productId: p.id, quantity: 1 }),
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="mt-auto px-3 py-1 bg-primary text-white rounded-full text-xs sm:text-sm"
                  >
                    Add to cart
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Vendor testimonials */}
        <section className="pt-4">
          <h3 className="text-xl font-semibold mb-3">What customers say</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {testimonials.length === 0 ? (
              <p className="text-sm text-zinc-600">Testimonials for this vendor will appear here after approval.</p>
            ) : (
              testimonials.map((t: any) => (
                <div
                  key={t.id}
                  className="min-w-[260px] rounded-2xl shadow-md bg-white p-4 flex flex-col items-start"
                >
                  <p className="italic text-sm text-zinc-700 mb-2">“{t.content}”</p>
                  <span className="text-xs text-zinc-500">
                    {t.first_name ? `${t.first_name} ${t.last_name ?? ""}`.trim() : "Customer"}
                  </span>
                </div>
              ))
            )}
          </div>
          <TestimonialForm target="vendor" vendorSlug={vendor.slug} />
        </section>
      </main>
    </div>
  );
}

