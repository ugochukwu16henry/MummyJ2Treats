import type { Metadata } from "next";
import Link from "next/link";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

function toFullUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

type BlogPostDetail = {
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
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  media_embeds: { provider: string | null; url: string }[];
};

async function fetchPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/blog/slug/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json as BlogPostDetail) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) {
    return {
      title: "Blog post | MummyJ2Treats",
    };
  }

  const title = post.seo_title ?? post.title;
  const description =
    post.seo_description ??
    post.excerpt ??
    "Premium homemade food insights from MummyJ2Treats vendors and founder.";
  const ogImage = post.og_image_url ?? post.featured_image_url ?? "/icon.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: "article",
    },
  };
}

function renderEmbed(embed: { provider: string | null; url: string }) {
  const rawUrl = embed.url;
  const provider = (embed.provider ?? "").toLowerCase();
  const resolvedUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;

  // YouTube
  if (provider === "youtube" || resolvedUrl.includes("youtube.com") || resolvedUrl.includes("youtu.be")) {
    let videoId = "";
    try {
      const u = new URL(resolvedUrl);
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get("v") ?? "";
      }
    } catch {
      // ignore
    }
    if (videoId) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Embedded video"
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }
  }

  // Uploaded house videos or direct video links
  if (
    provider === "upload" ||
    provider === "video" ||
    resolvedUrl.endsWith(".mp4") ||
    resolvedUrl.endsWith(".webm") ||
    resolvedUrl.endsWith(".ogg")
  ) {
    const ext = resolvedUrl.split(/[#?]/)[0].split(".").pop()?.toLowerCase();
    const mime = ext === "webm" ? "video/webm" : ext === "ogg" ? "video/ogg" : "video/mp4";
    return (
      <div className="w-full overflow-hidden rounded-xl bg-black aspect-video">
        <video
          controls
          className="w-full h-full object-contain"
          preload="metadata"
          crossOrigin="anonymous"
          playsInline
        >
          <source src={resolvedUrl} type={mime} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Simple generic card for other platforms (X, TikTok, Instagram, etc.)
  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      View media: {resolvedUrl}
    </a>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-zinc-900 dark:text-white">
          Post not found
        </h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-4">
          This article may have been unpublished or does not exist.
        </p>
        <Link href="/blog" className="text-primary text-sm hover:underline">
          ← Back to Blog
        </Link>
      </main>
    );
  }

  const publishedLabel = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const paragraphs = post.content.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black">
      <article className="max-w-3xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <header className="mb-6">
          <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">
            {post.category ?? "MummyJ2Treats Blog"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                {post.author_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toFullUrl(post.author_avatar_url) ?? post.author_avatar_url}
                    alt={post.author_name ?? "Author"}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-[11px] font-semibold">
                    {post.author_name?.slice(0, 1) ?? "M"}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                  {post.author_name ?? "MummyJ2Treats"}
                </div>
                <div className="text-[11px]">
                  {publishedLabel ?? "Unpublished draft"}
                  {post.reading_time_minutes ? ` · ${post.reading_time_minutes} min read` : null}
                </div>
              </div>
            </div>
            <div className="flex-1" />
            {post.author_slug && (
              <Link
                href={`/blog/vendor/${post.author_slug}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                More from {post.author_name ?? "this vendor"}
              </Link>
            )}
          </div>
          {post.featured_image_url && (
            <div className="mb-6 rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={toFullUrl(post.featured_image_url) ?? post.featured_image_url}
                alt={post.title}
                className="w-full h-full max-h-[420px] object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}
        </header>

        <section className="prose prose-zinc dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
          {paragraphs.map((block, idx) => (
            <p key={idx}>{block}</p>
          ))}
        </section>

        {post.media_embeds.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Embedded media
            </h2>
            {post.media_embeds.map((embed, idx) => (
              <div key={`embed-${idx}-${embed.url}`}>{renderEmbed(embed)}</div>
            ))}
          </section>
        )}

        <footer className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-zinc-500">
            <span className="font-semibold">Enjoyed this article?</span> Explore more stories from our
            verified vendors and founder.
          </div>
          <div className="flex gap-2">
            <form
              action={async () => {
                "use server";
                if (!post.author_slug) return;
                const vendorId = post.author_slug;
                await fetch(`${API_BASE}/blog/subscribe/author/${vendorId}`, {
                  method: "POST",
                  credentials: "include",
                });
              }}
            >
              <button
                type="submit"
                className="px-3 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90"
              >
                Subscribe to author
              </button>
            </form>
            <Link
              href="/blog"
              className="px-3 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Back to blog
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}

