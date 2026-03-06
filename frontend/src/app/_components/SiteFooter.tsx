import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 mt-12 text-white"
      style={{ backgroundColor: "var(--secondary)" }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <div>
          <h3 className="font-bold mb-3 text-white">Company</h3>
          <ul className="space-y-2 text-sm text-white/90">
            <li>
              <Link href="/about" className="hover:text-[var(--accent)] transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-[var(--accent)] transition-colors">
                Blog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-white">Shop</h3>
          <ul className="space-y-2 text-sm text-white/90">
            <li>
              <Link href="/categories" className="hover:text-[var(--accent)] transition-colors">
                All categories
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-[var(--accent)] transition-colors">
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-white">Help</h3>
          <ul className="space-y-2 text-sm text-white/90">
            <li>
              <Link href="/help" className="hover:text-[var(--accent)] transition-colors">
                Help
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-[var(--accent)] transition-colors">
                Support
              </Link>
            </li>
            <li>
              <Link href="/faqs" className="hover:text-[var(--accent)] transition-colors">
                FAQs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-white">Legal</h3>
          <ul className="space-y-2 text-sm text-white/90">
            <li>
              <Link href="/legal" className="hover:text-[var(--accent)] transition-colors">
                Legal
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
          <div className="flex gap-4 mt-4">
            <a href="#" aria-label="Twitter" className="text-white/80 hover:text-[var(--accent)] transition-colors">
              <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                twitter
              </span>
            </a>
            <a href="#" aria-label="Instagram" className="text-white/80 hover:text-[var(--accent)] transition-colors">
              <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                instagram
              </span>
            </a>
            <a href="#" aria-label="Facebook" className="text-white/80 hover:text-[var(--accent)] transition-colors">
              <span className="material-icons" style={{ fontSize: "1.25rem" }}>
                facebook
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-white/20 text-center text-xs text-white/70 space-y-1 px-0">
        <div>© {new Date().getFullYear()} MummyJ2Treats. All rights reserved.</div>
        <div>
          Built by{" "}
          <a
            href="https://henry-ugochukwu-porfolio.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            Henry M. Ugochukwu
          </a>
        </div>
      </div>
    </footer>
  );
}
