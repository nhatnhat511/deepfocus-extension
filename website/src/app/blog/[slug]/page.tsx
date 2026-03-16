import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../posts";

export const runtime = "edge";

type BlogPageProps = {
  params: { slug: string };
};

function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) || null;
}

export function generateMetadata({ params }: BlogPageProps): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return {
      title: "Blog",
      description: "DeepFocus Time insights on focus routines and productivity.",
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: post.featuredImage
      ? {
          images: [
            {
              url: post.featuredImage,
              alt: post.title,
            },
          ],
        }
      : undefined,
  };
}

export default function BlogPostPage({ params }: BlogPageProps) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {new Date(post.date).toLocaleDateString()}
          {post.author ? ` - ${post.author}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
      </header>

      {post.featuredImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.featuredImage}
          alt={post.title}
          className="h-56 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
          loading="lazy"
        />
      ) : null}

      <section className="space-y-4 text-sm leading-6 text-slate-700">
        {post.content.map((paragraph, index) => (
          <p key={`${post.slug}-${index}`}>{paragraph}</p>
        ))}
      </section>

      <div>
        <Link
          href="/blog"
          className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Back to blog
        </Link>
      </div>
    </article>
  );
}
