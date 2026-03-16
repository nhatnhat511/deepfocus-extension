import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DeepFocus Time – Complete User Guide",
  description: "Complete user guide for DeepFocus Time, covering setup, focus workflows, and advanced features.",
};

async function loadArticleHtml() {
  const filePath = path.join(process.cwd(), "content", "articles", "deepfocus-time-complete-user-guide", "article.body.html");
  const html = await readFile(filePath, "utf8");
  return html;
}

export default async function ArticlePage() {
  const html = await loadArticleHtml();

  return (
    <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User Guide</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">DeepFocus Time – Complete User Guide</h1>
        <p className="text-sm text-slate-600">
          Everything you need to set up DeepFocus Time and get the most out of its focus workflows.
        </p>
      </header>

      <div
        className="article-content prose prose-slate max-w-none text-left"
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
        .article-content {
          text-align: left;
        }

        .article-content h2.step-heading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 2.25rem 0 1rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .article-content .step-badge {
          display: inline-flex;
          height: 2rem;
          width: 2rem;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .article-content h3 {
          margin-top: 1.5rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .article-content img {
          max-width: 720px;
          width: 100%;
          height: auto;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: block;
          margin: 1.5rem auto;
        }

        .article-content img[src$=".gif"],
        .article-content img[src$=".GIF"] {
          max-height: 520px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
        }

        .article-content .separator {
          text-align: left !important;
          margin: 1.5rem 0;
        }

        .article-content ol,
        .article-content ul {
          padding-left: 1.5rem;
          list-style-position: outside;
        }

        .article-content ol {
          list-style-type: decimal;
        }

        .article-content ul {
          list-style-type: disc;
        }

        .article-content .list-spacer {
          height: 0.75rem;
        }
      `}</style>
    </article>
  );
}
