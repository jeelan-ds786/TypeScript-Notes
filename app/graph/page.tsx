import type { Metadata } from "next";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { KnowledgeShell } from "@/components/knowledge-shell";
import { getAllNotes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Knowledge graph (BETA)",
  description:
    "Explore connections between JavaScript notes, episodes, and topics.",
};

export default function GraphPage() {
  const notes = getAllNotes();
  const graphNotes = notes.map(({ title, slug, episode, tags }) => ({
    title,
    slug,
    episode,
    tags,
  }));

  return (
    <KnowledgeShell notes={notes} graphActive>
      <KnowledgeGraph notes={graphNotes} />
    </KnowledgeShell>
  );
}
