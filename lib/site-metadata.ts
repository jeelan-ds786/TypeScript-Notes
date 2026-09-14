import "server-only";

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getAllNotes } from "./notes";

type CommitRecord = {
  hash: string;
  date: string;
  author: string;
  files: string[];
};

const notesDirectory = path.join(process.cwd(), "1.Contents");

function readNoteCommits(): CommitRecord[] {
  try {
    const output = execFileSync(
      "git",
      ["log", "--format=COMMIT:%H|%aI|%an", "--name-only", "--", "1.Contents"],
      { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const commits: CommitRecord[] = [];
    let current: CommitRecord | undefined;

    for (const line of output.split("\n")) {
      if (line.startsWith("COMMIT:")) {
        const [hash, date, ...authorParts] = line.slice(7).split("|");
        current = { hash, date, author: authorParts.join("|"), files: [] };
        commits.push(current);
      } else if (current && line.startsWith("1.Contents/") && line.endsWith(".md")) {
        current.files.push(line.slice("1.Contents/".length));
      }
    }

    return commits;
  } catch {
    return [];
  }
}

function siteOrigin() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || null;
}

export function getSiteMetadata() {
  const notes = getAllNotes();
  const commits = readNoteCommits();
  const origin = siteOrigin();
  const commitsByFile = Map.groupBy(
    commits.flatMap((commit) => commit.files.map((file) => ({ ...commit, file }))),
    (commit) => commit.file,
  );

  const publishedNotes = notes.map((note) => {
    const noteCommits = commitsByFile.get(note.fileName) ?? [];
    const fileStats = fs.statSync(path.join(notesDirectory, note.fileName));
    const newestCommit = noteCommits[0];
    const oldestCommit = noteCommits.at(-1);
    const route = `/notes/${note.slug}/`;

    return {
      title: note.title,
      slug: note.slug,
      path: route,
      url: origin ? `${origin}${route}` : null,
      episode: note.episode,
      topics: note.tags,
      primaryTopic: note.tags[0] ?? null,
      publishedAt: oldestCommit?.date ?? fileStats.birthtime.toISOString(),
      updatedAt: newestCommit?.date ?? fileStats.mtime.toISOString(),
      contributionCount: noteCommits.length || 1,
    };
  });

  const topicCounts = new Map<string, number>();
  const episodeCounts = new Map<string, number>();
  for (const note of publishedNotes) {
    episodeCounts.set(note.episode, (episodeCounts.get(note.episode) ?? 0) + 1);
    for (const topic of note.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }

  const contributionDays = new Map<string, number>();
  const contributorCounts = new Map<string, number>();
  for (const commit of commits) {
    const day = commit.date.slice(0, 10);
    contributionDays.set(day, (contributionDays.get(day) ?? 0) + 1);
    contributorCounts.set(commit.author, (contributorCounts.get(commit.author) ?? 0) + 1);
  }

  const byCountThenName = ([firstName, firstCount]: [string, number], [secondName, secondCount]: [string, number]) =>
    secondCount - firstCount || firstName.localeCompare(secondName);

  return {
    schemaVersion: 1,
    site: {
      name: "FareeWiki",
      description: "Practical notes for understanding artificial intelligence.",
      origin,
      repository: "Namaste-AI-notes",
    },
    totals: {
      notes: publishedNotes.length,
      topics: topicCounts.size,
      episodes: episodeCounts.size,
      contributions: commits.length || publishedNotes.length,
      contributors: contributorCounts.size || 1,
    },
    recentlyPublished: [...publishedNotes]
      .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
      .slice(0, 10),
    topics: [...topicCounts.entries()]
      .sort(byCountThenName)
      .map(([topic, noteCount]) => ({ topic, noteCount })),
    episodes: [...episodeCounts.entries()].map(([episode, noteCount]) => ({ episode, noteCount })),
    contributions: {
      byDay: [...contributionDays.entries()]
        .sort(([firstDay], [secondDay]) => firstDay.localeCompare(secondDay))
        .map(([date, count]) => ({ date, count })),
      byContributor: [...contributorCounts.entries()]
        .sort(byCountThenName)
        .map(([name, count]) => ({ name, count })),
    },
    notes: publishedNotes,
  };
}