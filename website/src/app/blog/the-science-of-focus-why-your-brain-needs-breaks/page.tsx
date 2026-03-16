import path from "path";
import fs from "fs";
import type { Metadata } from "next";

const title = "The Science of Focus: Why Your Brain Needs Breaks";

export const metadata: Metadata = {
  title,
};

export default function BlogArticlePage() {
  const filePath = path.join(process.cwd(), "content", "articles", "the-science-of-focus-why-your-brain-needs-breaks", "article.body.html");
  const html = fs.readFileSync(filePath, "utf8");

  return (
    <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      </header>

      <div className="article-content text-left" dangerouslySetInnerHTML={{ __html: html }} />

      <style>{`
        .article-content {
          text-align: left;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          display: block;
          margin: 1rem auto;
        }
        .article-content p + p {
          margin-top: 0.75rem;
        }
        .article-content h2 {
          margin-top: 2rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }
        .article-content h3 {
          margin-top: 1.25rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .article-content ul,
        .article-content ol {
          padding-left: 1.5rem;
          margin-top: 0.75rem;
        }
      `}</style>
    </article>
  );
}
