import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <>
      <div
        className="h-9 sm:h-10 flex items-center justify-center text-white text-xs sm:text-sm font-medium px-4"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        Fresh homemade treats delivered in Lagos
      </div>
      <nav className="sticky top-0 z-30 bg-[var(--background)]/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 self-center sm:self-auto">
              <Image src="/mummyj2logo.png" alt="MummyJ2Treats" width={40} height={40} className="rounded-lg sm:w-12 sm:h-12" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                MummyJ2Treats
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6 md:gap-x-8 sm:flex-1 sm:justify-center">
              <Link href="/" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                Home
              </Link>
              <Link href="/categories" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                Shop all
              </Link>
              <Link href="/search" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                Search
              </Link>
              <Link href="/blog" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                Blog
              </Link>
              <Link href="/about" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                About
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0">
              <Link href="/auth/login" className="text-sm font-medium transition-colors hover:opacity-80 py-1" style={{ color: "var(--foreground)" }}>
                Login
              </Link>
              <Link href="/cart" className="relative p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]" aria-label="Cart" style={{ color: "var(--primary)" }}>
                <span className="material-icons text-2xl sm:text-[1.5rem]">shopping_cart</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
