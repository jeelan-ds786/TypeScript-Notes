import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleTools } from "@/components/article-tools";
import { KnowledgeShell } from "@/components/knowledge-shell";
import { MarkdownContent } from "@/components/markdown-content";
import { getMarkdownHeadings } from "@/lib/markdown-headings";
import { getAllNotes, getNote } from "@/lib/notes";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  return { title: note?.title || "Note" };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notes = getAllNotes();
  const note = getNote(slug);
  if (!note) notFound();

  const index = notes.findIndex((item) => item.slug === slug);
  const previous = notes[index - 1];
  const next = notes[index + 1];
  const headings = getMarkdownHeadings(note.content);

  return (
    <KnowledgeShell notes={notes} activeSlug={slug}>
      <article className="article" data-article>
        <header className="article-header">
          <span className="eyebrow">{note.episode}</span>
          <h1>{note.title}</h1>
          {!!note.tags.length && (
            <div className="tag-list">
              {note.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </header>
        <ArticleTools slug={slug} headings={headings} />
        <div className="prose">
          <MarkdownContent content={note.content} headings={headings} />
        </div>
        <footer className="article-pagination">
          {previous ? (
            <Link href={`/notes/${previous.slug}/`}>
              <ArrowLeft />
              <span>
                <small>Previous</small>
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/notes/${next.slug}/`}>
              <span>
                <small>Next</small>
                {next.title}
              </span>
              <ArrowRight />
            </Link>
          )}
        </footer>
      </article>
    </KnowledgeShell>
  );
}
