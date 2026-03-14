import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "DeepFocus Time insights on focus routines, productivity, and mindful break strategies.",
};

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Blog</h1>
        <p className="mt-2 text-sm text-slate-600">
          Product updates, focus strategies, and practical guidance for consistent deep work.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {blogPosts.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {new Date(post.date).toLocaleDateString()}
              {post.author ? ` - ${post.author}` : ""}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Read article
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
