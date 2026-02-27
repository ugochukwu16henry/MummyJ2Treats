import Link from 'next/link';

export default async function VendorListPage() {
  // Fetch vendors from API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/vendors`, { cache: 'no-store' });
  const json = await res.json();
  const vendors = json.data ?? [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">All Vendors</h1>
      <ul className="space-y-4">
        {vendors.length === 0 ? (
          <li className="text-zinc-500">No vendors found.</li>
        ) : (
          vendors.map((vendor: any) => (
            <li key={vendor.id} className="border p-4 rounded shadow">
              <Link href={`/vendor/${vendor.slug}`} className="text-lg font-semibold text-blue-600 hover:underline">
                {vendor.business_name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
