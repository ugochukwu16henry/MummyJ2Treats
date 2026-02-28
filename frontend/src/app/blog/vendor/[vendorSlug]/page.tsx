import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function toFullAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${API_BASE.replace(/\/$/, "")}${url}` : url;
}

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

async function fetchAuthorPosts(vendorSlug: string) {
  try {
    const res = await fetch(`${API_BASE}/blog/author/${vendorSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return [] as BlogPostCard[];
    const json = await res.json();
    const posts: BlogPostCard[] = json.data ?? [];
    return posts;
  } catch {
    return [] as BlogPostCard[];
  }
}

export default async function AuthorBlogPage({
  params,
}: {
  params: { vendorSlug: string };
}) {
  const posts = await fetchAuthorPosts(params.vendorSlug);
  const first = posts[0];

  const authorName = first?.author_name ?? params.vendorSlug.replace(/-/g, " ");
  const avatarLetter = authorName.slice(0, 1).toUpperCase();
  const avatarUrl = toFullAvatarUrl(first?.author_avatar_url ?? null) ?? first?.author_avatar_url ?? null;
  const state = first?.location_state ?? null;
  const city = first?.location_city ?? null;

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black">
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <header className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLetter
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                {authorName}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                Verified MummyJ2Treats {first ? "vendor" : "author"} sharing stories, tips, and
                behind-the-scenes from their kitchen and catering journey.
              </p>
              {(city || state) && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  {city ? `${city}, ` : ""}
                  {state}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 text-xs">
            <form
              action={async () => {
                "use server";
                if (!first?.author_slug) return;
                const vendorId = first.author_slug;
                await fetch(`${API_BASE}/blog/subscribe/author/${vendorId}`, {
                  method: "POST",
                  credentials: "include",
                });
              }}
            >
              <button
                type="submit"
                className="px-3 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90"
              >
                Subscribe to this author
              </button>
            </form>
            <Link href="/blog" className="text-primary hover:underline">
              ← Back to Blog
            </Link>
          </div>
        </header>

        {posts.length === 0 ? (
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            This author has not published any articles yet. Once their posts are approved, they will
            appear here.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
              >
                <div className="w-full aspect-[4/3] rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2 flex items-center justify-center">
                  {post.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-zinc-500">Author blog</span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-xs text-zinc-500 line-clamp-2">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500">
                  {post.published_at &&
                    new Date(post.published_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  {post.reading_time_minutes ? ` · ${post.reading_time_minutes} min` : null}
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

