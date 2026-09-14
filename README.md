# FareeWiki

A statically exported Next.js site generated directly from this Markdown vault.

## Add or update notes

1. Add or edit a Markdown file in `1.Contents/`.
2. Add or edit its row in `0.IndexMapper/IndexMapper.md`.
3. Commit and push the changes to GitHub.

No React or Next.js file needs to be changed. During each build, the site reads the files again:

- **Subtopic** controls the sidebar episode group. Leave it blank to continue the previous episode.
- **Topics** controls the title shown on the website.
- **Tags** become searchable topic tags. Write them as `#tag-name`.
- **Notes Link** must use an Obsidian WikiLink matching the Markdown filename without `.md`, for example `[[32.Vector Databases]]`.
- The linked file's Markdown is rendered as the complete article body, including tables, code blocks, lists, and Mermaid diagrams.

A Markdown file that is not yet in the mapper is still published under **More notes**. A mapper link without a matching file is skipped until its file is added.

## Knowledge graph

The `/graph/` page is rebuilt automatically from the same mapper data:

- Notes sharing one or more tags get a solid connection. More shared tags produce a stronger line.
- Consecutive notes in the same episode get a dashed learning-sequence connection.
- Episode groups use different node colors.
- Search accepts either note titles or `#tags`; selecting a node opens its note.
- The settings panel lets each reader adjust center force, repulsion, link distance, line width, node size, labels, and connection animation live.

The graph layout and canvas render entirely in the visitor's browser. It does not call a Vercel Function or require a database.

## Portfolio metadata

The static `/metadata.json` feed is rebuilt after every deployment for use by a personal portfolio or another website. It includes:

- total notes, topics, episodes, contributions, and contributors
- the 10 most recently published notes
- every note's title, route, URL, topics, episode, publication date, update date, and contribution count
- note counts grouped by topic and episode
- Git contribution counts grouped by day and contributor

Fetch it from the portfolio after deployment:

```js
const response = await fetch("https://your-fareewiki-domain.vercel.app/metadata.json");
const fareeWiki = await response.json();

console.log(fareeWiki.totals.notes);
console.log(fareeWiki.recentlyPublished);
console.log(fareeWiki.topics);
```

The feed allows cross-origin `GET` requests and is generated as a static JSON file, so portfolio requests do not invoke a Vercel Function. Set `NEXT_PUBLIC_SITE_URL` locally if absolute note URLs are needed outside Vercel.

## Local preview

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development command uses Nodemon to restart Next.js when Markdown, page, component, library, style, public asset, or project configuration files change. Next.js Fast Refresh may apply source changes before a full restart is needed.

To verify the exact static output that Vercel will deploy:

```bash
npm run build
npm start
```

## Vercel deployment

Import this GitHub repository into Vercel once and keep the detected **Next.js** framework preset. The build command is `npm run build`; the static output is configured by `output: "export"` in `next.config.ts`.

After that, every push to the production branch triggers a fresh deployment automatically. The live site serves prebuilt HTML, CSS, and JavaScript from Vercel's CDN. Mermaid is rendered in the reader's browser, so normal page visits do not invoke a Serverless Function.