import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getPublicPostByCategorySlug } from "@/lib/cms/publicContent.server";

type CategoryPostPageProps = {
  params: { category: string; slug: string };
};

function formatPostDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function sanitizePostHtml(source: string) {
  return sanitizeHtml(source, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "code",
      "pre",
      "hr",
      "span",
      "div",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      span: ["style"],
      p: ["style"],
      div: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noreferrer noopener", target: "_blank" }, true),
    },
  });
}

export async function generateMetadata({ params }: CategoryPostPageProps): Promise<Metadata> {
  const post = await getPublicPostByCategorySlug(params.category, params.slug);
  if (!post) {
    return {
      title: "Blog",
      description: "DeepFocus Time insights on focus routines and productivity.",
    };
  }
  return {
    title: post.title,
    description: post.excerpt ?? "DeepFocus Time insights on focus routines and productivity.",
  };
}

export default async function CategoryPostPage({ params }: CategoryPostPageProps) {
  const post = await getPublicPostByCategorySlug(params.category, params.slug);
  if (!post) {
    notFound();
  }

  const dateLabel = formatPostDate(post.published_at ?? post.updated_at);
  const sanitized = sanitizePostHtml(post.content || "");

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        {dateLabel ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dateLabel}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
        {post.excerpt ? <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p> : null}
      </header>

      <section
        className="prose prose-slate max-w-none text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: sanitized || "<p>No content yet.</p>" }}
      />

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
