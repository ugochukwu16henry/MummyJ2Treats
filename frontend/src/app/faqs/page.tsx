import Link from "next/link";

const qa = [
  { q: "How do I place an order?", a: "Browse the homepage or any vendor store, add items to your cart, go to Cart and checkout. Enter delivery details and pay online via Paystack. Once payment is confirmed, your order is placed." },
  { q: "What payment methods do you accept?", a: "We accept online payments through Paystack (card, bank transfer, and other methods supported in your region). Payments are secure and processed at checkout." },
  { q: "How do I become a vendor?", a: "Click Become a Vendor (homepage or footer), fill in the vendor signup form with your details and password to create your account. After admin approves your account, you can add products and start receiving orders from your vendor dashboard." },
  { q: "How do I become a rider?", a: "Register as a rider via the rider registration flow. Once your profile is set (state, cities, transport type), vendors and admin can assign you to orders for delivery in your area." },
  { q: "How is delivery handled?", a: "Delivery address and fees are collected at checkout. Vendors or admin can assign riders to orders. Track order status in My orders (customers) or in your dashboard (vendors)." },
  { q: "Can I cancel or change my order?", a: "Order cancellation and changes depend on order status. Check your order details in the dashboard; for specific cases, use support for assistance." },
  { q: "Who runs the homepage founder store?", a: "The homepage showcases the founder admin store (MummyJ2Treats). Other vendors have their own store pages. Browse all vendors from the Vendors link." },
];

export default function FAQsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-zinc-900 dark:text-white">
        Frequently Asked Questions
      </h1>
      <p className="mb-8 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 text-center">
        Quick answers about ordering, vendors, riders, and payments.
      </p>
      <div className="space-y-4">
        {qa.map((item, i) => (
          <section key={i} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-6 border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">{item.q}</h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">{item.a}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/help" className="text-primary hover:underline">← Back to Help</Link>
      </p>
    </div>
  );
}
