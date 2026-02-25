
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans dark:bg-black">
      {/* Announcement Bar */}
      <div className="h-10 flex items-center justify-center bg-[#1E1E2F] text-white text-sm font-medium">
        Fresh homemade treats delivered in Lagos 🚚
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Image src="/mummyj2logo.png" alt="MummyJ2Treats Logo" width={40} height={40} />
        </div>
        <div className="hidden md:flex gap-6 text-base font-medium">
          <a href="#" className="hover:text-primary">Home</a>
          <a href="#" className="hover:text-primary">Vendors</a>
          <a href="#" className="hover:text-primary">Categories</a>
          <a href="#" className="hover:text-primary">About</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:block"><span className="material-icons">search</span></button>
          <button className="text-sm font-medium">Login</button>
          <button className="relative">
            <span className="material-icons">shopping_cart</span>
            <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full px-1">2</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 px-4 py-20 md:py-24 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
        <div className="flex-1 flex flex-col gap-6 items-start">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-zinc-900 dark:text-white">Bringing Homemade Excellence to Your Table</h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300">Order delicious, trusted homemade meals from Lagos’ best home cooks and caterers.</p>
          <div className="flex gap-4 mt-4">
            <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-lg shadow hover:bg-primary/90">Order Now</button>
            <button className="bg-white border border-primary text-primary px-6 py-3 rounded-full font-semibold text-lg hover:bg-primary/10">Become a Vendor</button>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Image src="/hero-food.png" alt="Food Spread" width={400} height={320} className="rounded-2xl shadow-xl object-cover" />
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map((cat) => (
            <div key={cat} className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3" />
              <span className="font-medium">Category {cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Featured Vendors</h2>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {[1,2,3,4,5].map((v) => (
            <div key={v} className="min-w-[220px] rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2" />
              <span className="font-semibold">Vendor {v}</span>
              <span className="text-yellow-500">★★★★★</span>
              <button className="mt-2 px-4 py-1 bg-primary text-white rounded-full text-sm">View Store</button>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Best Sellers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map((p) => (
            <div key={p} className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col items-center">
              <div className="w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-3" />
              <span className="font-semibold">Product {p}</span>
              <span className="text-sm text-zinc-500">Vendor {p}</span>
              <span className="font-bold text-lg mt-1">₦2,500</span>
              <button className="mt-2 px-4 py-1 bg-primary text-white rounded-full text-sm">Add to Cart</button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
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
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Testimonials</h2>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {[1,2,3].map((t) => (
            <div key={t} className="min-w-[320px] rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3" />
              <p className="italic text-zinc-600 dark:text-zinc-300 mb-2">“Amazing food and fast delivery!”</p>
              <span className="font-semibold">Customer {t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 px-4 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Get the best homemade treats in your inbox</h2>
        <form className="flex flex-col sm:flex-row gap-4 justify-center">
          <input type="email" placeholder="Your email" className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 focus:outline-none" />
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full font-semibold">Subscribe</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12 px-4 mt-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-2">Company</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Vendors</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#">Become a Vendor</a></li>
              <li><a href="#">Vendor Login</a></li>
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
