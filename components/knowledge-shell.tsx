"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Menu,
  Moon,
  Network,
  Search,
  Sun,
  X,
} from "lucide-react";
import type { Note } from "@/lib/notes";

type NavNote = Pick<Note, "title" | "slug" | "episode" | "tags">;
const completionKey = "fareewiki-completed-notes";

export function KnowledgeShell({
  notes,
  activeSlug,
  graphActive = false,
  children,
}: {
  notes: NavNote[];
  activeSlug?: string;
  graphActive?: boolean;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("fareewiki-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    const frame = requestAnimationFrame(() => setDark(shouldUseDark));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = JSON.parse(
        localStorage.getItem(completionKey) ?? "[]",
      ) as string[];
      setCompletedSlugs(new Set(saved));
    });
    function markCompleted(event: Event) {
      const slug = (event as CustomEvent<string>).detail;
      setCompletedSlugs((current) => new Set(current).add(slug));
    }
    addEventListener("fareewiki-note-completed", markCompleted);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("fareewiki-note-completed", markCompleted);
    };
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem("fareewiki-theme", nextDark ? "dark" : "light");
  }

  const normalizedQuery = query.toLowerCase().replace(/^#/, "");
  const filtered = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
  );
  const groups = Map.groupBy(filtered, (note) => note.episode);

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Link href="/" className="brand compact">
          <span className="brand-mark">FW</span>
          <span>FareeWiki</span>
        </Link>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="icon-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">FW</span>
            <span>
              <strong>FareeWiki</strong>
              <small>Field notes for curious minds</small>
            </span>
          </Link>
          <button
            className="icon-button close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes or #tags"
            />
          </label>
        </div>

        <nav className="note-nav" aria-label="Notes">
          <Link
            href="/graph/"
            className={`graph-nav-link ${graphActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Network size={16} />
            <span>Knowledge graph</span>
            <small>Beta · Try out</small>
          </Link>
          {[...groups.entries()].map(([episode, groupNotes]) => (
            <section className="nav-group" key={episode}>
              <h2>{episode}</h2>
              {groupNotes.map((note) => (
                <Link
                  href={`/notes/${note.slug}/`}
                  className={`${note.slug === activeSlug ? "active" : ""}${completedSlugs.has(note.slug) ? " completed" : ""}`}
                  key={note.slug}
                  onClick={() => setMenuOpen(false)}
                >
                  {completedSlugs.has(note.slug) ? (
                    <CheckCircle2 className="completion-icon" size={15} />
                  ) : (
                    <BookOpen size={15} />
                  )}
                  <span>{note.title}</span>
                </Link>
              ))}
            </section>
          ))}
          {!filtered.length && (
            <p className="empty-search">No notes match “{query}”.</p>
          )}
        </nav>

        <div className="sidebar-footer">
          <span>{notes.length} notes</span>
          <button className="theme-button" onClick={toggleTheme}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="main-content">{children}</main>
    </div>
  );
}
