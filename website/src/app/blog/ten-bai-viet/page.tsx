import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DeepFocus Time – Complete User Guide",
  description: "Complete user guide for DeepFocus Time, covering setup, focus workflows, and advanced features.",
};

async function loadArticleHtml() {
  const filePath = path.join(process.cwd(), "content", "articles", "ten-bai-viet", "article.body.html");
  const html = await readFile(filePath, "utf8");
  return html;
}

export default async function ArticlePage() {
  const html = await loadArticleHtml();

  return (
    <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User Guide</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">DeepFocus Time – Complete User Guide</h1>
        <p className="text-sm text-slate-600">
          Everything you need to set up DeepFocus Time and get the most out of its focus workflows.
        </p>
      </header>

      <div
        className="article-content prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex justify-center">
        <Link
          href="/signup"
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Create Your Account
        </Link>
      </div>

      <style>{`
        .article-content img {
          width: 100%;
          height: auto;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          margin: 1.5rem auto;
        }

        .article-content img[src$=".gif"],
        .article-content img[src$=".GIF"] {
          max-height: 520px;
          object-fit: contain;
        }

        .article-content .separator {
          text-align: center !important;
          margin: 1.5rem 0;
        }

        .article-content ol,
        .article-content ul {
          padding-left: 1.5rem;
        }
      `}</style>
    </article>
  );
}
