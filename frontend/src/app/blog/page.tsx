import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BlogPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  location_state: string | null;
  location_city: string | null;
  featured_image_url: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  created_at: string;
  views_count: number;
  author_name: string | null;
  author_slug: string | null;
  author_avatar_url: string | null;
};

async function fetchBlogPosts(searchParams: {
  q?: string;
  vendorSlug?: string;
  category?: string;
  state?: string;
  city?: string;
  sort?: string;
  page?: string;
}) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.vendorSlug) params.set("vendorSlug", searchParams.vendorSlug);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.state) params.set("state", searchParams.state);
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.sort) params.set("sort", searchParams.sort);

  const page = Number(searchParams.page ?? "1") || 1;
  const limit = 9;
  params.set("limit", String(limit));
  params.set("offset", String((page - 1) * limit));

  try {
    const res = await fetch(`${API_BASE}/blog?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return { posts: [] as BlogPostCard[], page, hasNext: false };
    const json = await res.json();
    const posts: BlogPostCard[] = json.data ?? [];
    const hasNext = posts.length === limit;
    return { posts, page, hasNext };
  } catch {
    return { posts: [] as BlogPostCard[], page, hasNext: false };
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const flatParams: {
    q?: string;
    vendorSlug?: string;
    category?: string;
    state?: string;
    city?: string;
    sort?: string;
    page?: string;
  } = {
    q: typeof searchParams?.q === "string" ? searchParams.q : undefined,
    vendorSlug: typeof searchParams?.vendorSlug === "string" ? searchParams.vendorSlug : undefined,
    category: typeof searchParams?.category === "string" ? searchParams.category : undefined,
    state: typeof searchParams?.state === "string" ? searchParams.state : undefined,
    city: typeof searchParams?.city === "string" ? searchParams.city : undefined,
    sort: typeof searchParams?.sort === "string" ? searchParams.sort : undefined,
    page: typeof searchParams?.page === "string" ? searchParams.page : undefined,
  };

  const { posts, page, hasNext } = await fetchBlogPosts(flatParams);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black">
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <header className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              MummyJ2Treats Blog
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-2xl">
              Insights, stories, and tips from the founder and verified vendors — all about homemade food,
              catering, and building trusted food businesses.
            </p>
          </div>
          <form className="w-full md:w-80" method="get">
            <div className="flex rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <input
                name="q"
                defaultValue={flatParams.q ?? ""}
                placeholder="Search articles, vendors, topics..."
                className="flex-1 px-4 py-2 text-sm bg-transparent outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90"
              >
                Search
              </button>
            </div>
          </form>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {featured ? (
              <Link
                href={`/blog/${featured.slug}`}
                className="block rounded-3xl bg-white dark:bg-zinc-900 shadow-md overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-shadow"
              >
                <div className="relative h-52 sm:h-64 w-full">
                  {featured.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.featured_image_url}
                      alt={featured.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/20 to-amber-200 dark:from-primary/40 dark:to-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <div className="flex items-center gap-2 text-xs opacity-90 mb-1">
                      {featured.category && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                          {featured.category}
                        </span>
                      )}
                      {featured.location_city && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10">
                          {featured.location_city}
                          {featured.location_state ? `, ${featured.location_state}` : ""}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-2xl font-semibold mb-1 line-clamp-2">
                      {featured.title}
                    </h2>
                    <p className="text-xs sm:text-sm line-clamp-2 opacity-90">
                      {featured.excerpt ??
                        "A premium, curated story from the MummyJ2Treats community of cooks and caterers."}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
                      {featured.author_avatar_url ? (
                        <Image
                          src={featured.author_avatar_url}
                          alt={featured.author_name ?? "Author"}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                          {featured.author_name?.slice(0, 1) ?? "M"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {featured.author_name ?? "MummyJ2Treats Founder"}
                        </div>
                        <div className="text-[11px]">
                          {featured.published_at
                            ? new Date(featured.published_at).toLocaleDateString()
                            : "Coming soon"}
                          {featured.reading_time_minutes
                            ? ` · ${featured.reading_time_minutes} min read`
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-md border border-zinc-100 dark:border-zinc-800 p-6 text-center text-sm text-zinc-500">
                No blog posts yet. Once the founder and vendors start publishing, articles will appear here.
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {post.featured_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-zinc-500 text-center px-1">
                            Blog
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span>{post.author_name ?? "MummyJ2Treats"}</span>
                        {post.category && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px]">
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {post.published_at &&
                          new Date(post.published_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        {post.reading_time_minutes
                          ? ` · ${post.reading_time_minutes} min`
                          : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div className="flex items-center justify-between pt-4 text-xs text-zinc-500">
                <span>
                  Page {page}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={{
                        pathname: "/blog",
                        query: { ...flatParams, page: String(page - 1) },
                      }}
                      className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Previous
                    </Link>
                  )}
                  {hasNext && (
                    <Link
                      href={{
                        pathname: "/blog",
                        query: { ...flatParams, page: String(page + 1) },
                      }}
                      className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-semibold mb-2">Filter</h2>
              <form className="space-y-3 text-xs" method="get">
                <input type="hidden" name="q" defaultValue={flatParams.q ?? ""} />
                <div>
                  <label className="block mb-1 text-zinc-600 dark:text-zinc-300">
                    Sort by
                  </label>
                  <select
                    name="sort"
                    defaultValue={flatParams.sort ?? "recent"}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
                  >
                    <option value="recent">Most recent</option>
                    <option value="popular">Most popular</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-zinc-600 dark:text-zinc-300">
                      State
                    </label>
                    <input
                      name="state"
                      defaultValue={flatParams.state ?? ""}
                      placeholder="e.g. Akwa Ibom"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-zinc-600 dark:text-zinc-300">
                      City
                    </label>
                    <input
                      name="city"
                      defaultValue={flatParams.city ?? ""}
                      placeholder="e.g. Uyo"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-zinc-600 dark:text-zinc-300">
                    Category
                  </label>
                  <input
                    name="category"
                    defaultValue={flatParams.category ?? ""}
                    placeholder="e.g. Catering, Baking"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-1 px-3 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  Apply filters
                </button>
              </form>
            </section>

            <section className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-semibold mb-2">Stay updated</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-3">
                Subscribe to the global MummyJ2Treats blog to get new founder and vendor stories in your inbox.
              </p>
              <form
                action={async () => {
                  "use server";
                  await fetch(`${API_BASE}/blog/subscribe/global`, {
                    method: "POST",
                    credentials: "include",
                  });
                }}
              >
                <button
                  type="submit"
                  className="w-full px-3 py-2 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Subscribe to global blog
                </button>
              </form>
              <p className="mt-2 text-[11px] text-zinc-500">
                You can unsubscribe anytime from your email settings.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

