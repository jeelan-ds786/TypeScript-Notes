export type MarkdownHeading = {
  depth: 2 | 3;
  id: string;
  text: string;
};

function headingId(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getMarkdownHeadings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const usedIds = new Set<string>();
  let inFence = false;

  function uniqueId(base: string): string {
    if (!usedIds.has(base)) { usedIds.add(base); return base; }
    let n = 1;
    while (usedIds.has(`${base}-${n}`)) n++;
    const id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  }

  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const text = match[2].replace(/[`*_~]/g, "").trim();
    const baseId = headingId(text) || "section";
    headings.push({
      depth: match[1].length as 2 | 3,
      id: uniqueId(baseId),
      text,
    });
  }

  return headings;
}