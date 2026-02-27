import React from "react";

export default function VendorSignupPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Become a Vendor</h1>
      <form className="space-y-6">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium mb-1">Business Name</label>
          <input id="businessName" name="businessName" type="text" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" name="email" type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
          <input id="phone" name="phone" type="tel" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
          <input id="address" name="address" type="text" required className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-primary text-white font-semibold py-3 rounded">Sign Up</button>
      </form>
    </div>
  );
}
