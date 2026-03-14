import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPosts } from "@/lib/cms/publicContent.server";

export const metadata: Metadata = {
  title: "Blog",
  description: "DeepFocus Time insights on focus routines, productivity, and mindful break strategies.",
};

function formatPostDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

export default async function BlogPage() {
  const posts = await getPublicPosts();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Blog</h1>
        <p className="mt-2 text-sm text-slate-600">
          Product updates, focus strategies, and practical guidance for consistent deep work.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => {
          const dateLabel = formatPostDate(post.published_at ?? post.updated_at);
          const categorySlug = post.categories?.[0];
          const href = categorySlug ? `/categories/${categorySlug}/${post.slug}` : `/blog/${post.slug}`;
          return (
            <article key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
              {dateLabel ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dateLabel}</p>
              ) : null}
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h2>
              {post.excerpt ? <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p> : null}
              <Link
                href={href}
                className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Read article
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
