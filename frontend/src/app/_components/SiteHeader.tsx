import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <>
      <div
        className="h-10 flex items-center justify-center text-white text-sm font-medium"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        Fresh homemade treats delivered in Lagos
      </div>
      <nav className="sticky top-0 z-30 bg-[var(--background)]/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Image src="/mummyj2logo.png" alt="MummyJ2Treats" width={48} height={48} className="rounded-lg" />
            <span className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              MummyJ2Treats
            </span>
          </Link>
          <div className="flex items-center gap-5 sm:gap-8 text-sm font-medium">
            <Link href="/" className="transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
              Home
            </Link>
            <Link href="/categories" className="transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
              Shop
            </Link>
            <Link href="/blog" className="transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
              Blog
            </Link>
            <Link href="/about" className="transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
              About
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/auth/login" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--foreground)" }}>
              Login
            </Link>
            <Link href="/cart" className="relative p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]" aria-label="Cart" style={{ color: "var(--primary)" }}>
              <span className="material-icons" style={{ fontSize: "1.5rem" }}>
                shopping_cart
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
