
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Example product data (replace with real fetch)
  const product = {
    name: "Small Chops Deluxe",
    description: "A premium selection of small chops from Mummy Kitchen.",
    image: "/hero-food.png",
    price: 5000,
    vendor: "Mummy Kitchen",
    slug: params.slug,
    availability: true,
  };
  const url = `https://mummyj2treats.com/vendor/${product.vendor.toLowerCase().replace(/\s+/g, "-")}/${product.slug}`;
  return {
    title: `${product.name} | ${product.vendor} | MummyJ2Treats`,
    description: product.description,
    openGraph: {
      title: `${product.name} | ${product.vendor}`,
      description: product.description,
      url,
      images: [product.image],
      type: "product",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${product.vendor}`,
      description: product.description,
      images: [product.image],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  // Example product data (replace with real fetch)
  const product = {
    name: "Small Chops Deluxe",
    description: "A premium selection of small chops from Mummy Kitchen.",
    image: "/hero-food.png",
    price: 5000,
    vendor: "Mummy Kitchen",
    slug: params.slug,
    availability: true,
  };

  // Structured data (Schema.org Product)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "NGN",
      availability: product.availability ? "InStock" : "OutOfStock",
    },
    brand: {
      "@type": "Brand",
      name: product.vendor,
    },
    url: `https://mummyj2treats.com/vendor/${product.vendor.toLowerCase().replace(/\s+/g, "-")}/${product.slug}`,
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      <p className="text-zinc-600 mb-4">{product.description}</p>
      <img src={product.image} alt={product.name} className="rounded-lg mb-4" width={600} height={400} />
      <div className="mb-2">Vendor: <span className="font-semibold">{product.vendor}</span></div>
      <div className="mb-2">Price: <span className="font-semibold">₦{product.price}</span></div>
      <div className="mb-2">Availability: <span className={product.availability ? "text-green-600" : "text-red-600"}>{product.availability ? "In Stock" : "Out of Stock"}</span></div>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    </main>
  );
}
