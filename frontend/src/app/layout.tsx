import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "MummyJ2Treats",
  description: "Homemade treats from my kitchen to yours.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}

