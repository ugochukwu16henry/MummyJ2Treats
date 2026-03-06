\"use client\";

import { useState } from "react";
import { addGuestCartItem } from "../_lib/guestCart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Props = {
  productId: string;
  productName: string;
  price: number;
  vendorSlug: string;
};

export function VendorAddToCartButton({ productId, productName, price }: Props) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        credentials: \"include\",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.status === 401) {
        // Guest cart: add locally and only require login at checkout
        addGuestCartItem({
          productId,
          name: productName,
          price,
          quantity: 1,
        });
        return;
      }
      if (!res.ok) {
        // Silently ignore; PDP will surface errors more clearly
        return;
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <button
      type=\"button\"
      onClick={handleAdd}
      disabled={adding}
      className=\"mt-auto px-3 py-1 bg-primary text-white rounded-full text-xs sm:text-sm disabled:opacity-60\"
    >
      {adding ? \"Adding…\" : \"Add to cart\"}
    </button>
  );
}


