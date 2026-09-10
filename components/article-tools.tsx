"use client";

import { Check, ListTree } from "lucide-react";
import { useEffect, useState } from "react";
import type { MarkdownHeading } from "@/lib/markdown-headings";

const completionKey = "fareewiki-completed-notes";

export function ArticleTools({
  slug,
  headings,
}: {
  slug: string;
  headings: MarkdownHeading[];
}) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem(completionKey) ?? "[]",
    ) as string[];

    function updateProgress() {
      if (saved.includes(slug)) setCompleted(true);
      const article = document.querySelector<HTMLElement>("[data-article]");
      if (!article) return;
      const start = article.offsetTop;
      const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
      const nextProgress = Math.min(
        100,
        Math.max(0, ((window.scrollY - start) / distance) * 100),
      );
      setProgress(nextProgress);

      if (nextProgress < 90 || saved.includes(slug)) return;
      saved.push(slug);
      localStorage.setItem(completionKey, JSON.stringify(saved));
      setCompleted(true);
      window.dispatchEvent(
        new CustomEvent("fareewiki-note-completed", { detail: slug }),
      );
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    document.addEventListener("scroll", updateProgress, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      document.removeEventListener("scroll", updateProgress, { capture: true });
      window.removeEventListener("resize", updateProgress);
    };
  }, [slug]);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -68%", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      {!!headings.length && (
        <details className="article-toc">
          <summary>
            <ListTree size={16} />
            <span>On this page</span>
            {completed && <Check size={15} aria-label="Note completed" />}
          </summary>
          <ol>
            {headings.map((heading) => (
              <li className={`depth-${heading.depth}`} key={heading.id}>
                <a
                  className={activeId === heading.id ? "active" : ""}
                  href={`#${heading.id}`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
}
