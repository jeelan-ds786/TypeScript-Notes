import Link from "next/link";
import { ArrowRight, BookOpen, Hash, Route } from "lucide-react";
import { KnowledgeShell } from "@/components/knowledge-shell";
import { getAllNotes } from "@/lib/notes";

export default function Home() {
  const notes = getAllNotes();
  const episodes = Map.groupBy(notes, (note) => note.episode);
  const tags = [...new Set(notes.flatMap((note) => note.tags))];

  return (
    <KnowledgeShell notes={notes}>
      <div className="home-page">
        <div className="home-intro">
          <span className="eyebrow">Open TypeScript learning notes</span>
          <h1>
            Understand TypeScript,
            <br />
            one useful note at a time.
          </h1>
          <p>
            Clear explanations, type system mental models, and interview-ready
            recall tables. Start with the fundamentals or jump into the concept
            you need.
          </p>
          {notes[0] && (
            <Link className="primary-action" href={`/notes/${notes[0].slug}/`}>
              Start learning <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <div className="stat-strip" aria-label="Library statistics">
          <div>
            <BookOpen />
            <strong>{notes.length}</strong>
            <span>Published notes</span>
          </div>
          <div>
            <Route />
            <strong>{episodes.size}</strong>
            <span>Learning epics</span>
          </div>
          <div>
            <Hash />
            <strong>{tags.length}</strong>
            <span>Topic tags</span>
          </div>
        </div>

        <section className="learning-paths">
          <div className="section-heading">
            <span>Explore the Map</span>
            <h2>Learning paths</h2>
          </div>
          <div className="episode-list">
            {[...episodes.entries()].map(([episode, episodeNotes], index) => (
              <div className="episode-row" key={episode}>
                <span className="episode-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{episode}</h3>
                  <p>
                    {episodeNotes.length}{" "}
                    {episodeNotes.length === 1 ? "note" : "notes"}
                  </p>
                </div>
                <Link
                  href={`/notes/${episodeNotes[0].slug}/`}
                  aria-label={`Open ${episode}`}
                >
                  <ArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </KnowledgeShell>
  );
}
