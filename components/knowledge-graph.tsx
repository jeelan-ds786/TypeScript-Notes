"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Focus,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import type {
  ForceGraphMethods,
  GraphData,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";

const ForceGraph = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as typeof import("react-force-graph-2d").default;

export type GraphNote = {
  title: string;
  slug: string;
  episode: string;
  tags: string[];
};

type GraphNode = GraphNote & {
  id: string;
  connections: number;
  color: string;
};

type GraphLink = {
  source: string;
  target: string;
  kind: "tag" | "episode";
  label: string;
  weight: number;
};

const palette = [
  "#dc2626",
  "#b91c1c",
  "#ef4444",
  "#991b1b",
  "#f87171",
  "#c0392b",
  "#e53e3e",
  "#fc8181",
  "#9b2335",
  "#7f1d1d",
];

const defaultSettings = {
  centerStrength: 0.12,
  repulsion: 90,
  linkDistance: 48,
  linkWidth: 1,
  nodeSize: 1,
  labels: false,
  animate: true,
};

type GraphSettings = typeof defaultSettings;

function createGraph(notes: GraphNote[]): GraphData<GraphNode, GraphLink> {
  const episodeColors = new Map<string, string>();
  const links = new Map<string, GraphLink>();

  notes.forEach((note) => {
    if (!episodeColors.has(note.episode)) {
      episodeColors.set(
        note.episode,
        palette[episodeColors.size % palette.length],
      );
    }
  });

  for (let firstIndex = 0; firstIndex < notes.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < notes.length;
      secondIndex += 1
    ) {
      const first = notes[firstIndex];
      const second = notes[secondIndex];
      const sharedTags = first.tags.filter((tag) => second.tags.includes(tag));
      if (!sharedTags.length) continue;

      links.set(`${first.slug}:${second.slug}`, {
        source: first.slug,
        target: second.slug,
        kind: "tag",
        label: sharedTags.map((tag) => `#${tag}`).join(", "),
        weight: sharedTags.length,
      });
    }
  }

  const episodes = Map.groupBy(notes, (note) => note.episode);
  for (const episodeNotes of episodes.values()) {
    for (let index = 1; index < episodeNotes.length; index += 1) {
      const source = episodeNotes[index - 1];
      const target = episodeNotes[index];
      const key = `${source.slug}:${target.slug}`;
      if (!links.has(key)) {
        links.set(key, {
          source: source.slug,
          target: target.slug,
          kind: "episode",
          label: source.episode,
          weight: 1,
        });
      }
    }
  }

  const connectionCounts = new Map<string, number>();
  for (const link of links.values()) {
    connectionCounts.set(
      link.source,
      (connectionCounts.get(link.source) ?? 0) + 1,
    );
    connectionCounts.set(
      link.target,
      (connectionCounts.get(link.target) ?? 0) + 1,
    );
  }

  return {
    nodes: notes.map((note) => ({
      ...note,
      id: note.slug,
      connections: connectionCounts.get(note.slug) ?? 0,
      color: episodeColors.get(note.episode) ?? palette[0],
    })),
    links: [...links.values()],
  };
}

export function KnowledgeGraph({ notes }: { notes: GraphNote[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<
    | ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>>
    | undefined
  >(undefined);
  const forcesConfigured = useRef(false);
  const [size, setSize] = useState({ width: 900, height: 700 });
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GraphSettings>(defaultSettings);
  const deferredQuery = useDeferredValue(
    query.trim().toLowerCase().replace(/^#/, ""),
  );
  const graph = useMemo(() => createGraph(notes), [notes]);
  const subtopicColors = useMemo(
    () => [...new Map(graph.nodes.map((node) => [node.episode, node.color]))],
    [graph.nodes],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setDark(root.dataset.theme === "dark");
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const matches = graph.nodes.filter(
    (node) =>
      deferredQuery &&
      (node.title.toLowerCase().includes(deferredQuery) ||
        node.tags.some((tag) => tag.toLowerCase().includes(deferredQuery))),
  );
  const matchingIds = new Set(matches.map((node) => node.id));

  function applyForces(nextSettings = settings) {
    const graphApi = graphRef.current;
    if (!graphApi) return;
    graphApi.d3Force("charge")?.strength(-nextSettings.repulsion);
    graphApi.d3Force("center")?.strength(nextSettings.centerStrength);
    graphApi.d3Force("link")?.distance(nextSettings.linkDistance);
    graphApi.d3ReheatSimulation();
    forcesConfigured.current = true;
  }

  function updateSetting<Key extends keyof GraphSettings>(
    key: Key,
    value: GraphSettings[Key],
  ) {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    if (
      key === "centerStrength" ||
      key === "repulsion" ||
      key === "linkDistance"
    ) {
      applyForces(nextSettings);
    }
  }

  function resetSettings() {
    setSettings(defaultSettings);
    applyForces(defaultSettings);
  }

  function focusMatches() {
    if (!matches.length) {
      graphRef.current?.zoomToFit(500, 60);
      return;
    }
    const first = matches[0];
    if (typeof first.x === "number" && typeof first.y === "number") {
      graphRef.current?.centerAt(first.x, first.y, 500);
      graphRef.current?.zoom(3, 500);
    }
  }

  function paintNode(
    nodeObject: NodeObject<GraphNode>,
    context: CanvasRenderingContext2D,
    scale: number,
  ) {
    const node = nodeObject;
    const matched = matchingIds.has(node.id);
    const active = hovered === node.id || matched;
    const radius =
      (4.5 + Math.min(node.connections, 8) * 0.45) * settings.nodeSize +
      (active ? 2 : 0);

    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
    context.fillStyle =
      deferredQuery && !matched ? (dark ? "#51434a" : "#cfc4ca") : node.color;
    context.fill();
    if (active) {
      context.strokeStyle = dark ? "#ffffff" : "#261f23";
      context.lineWidth = 1.5 / scale;
      context.stroke();
    }

    if (settings.labels || scale > 4.5 || active) {
      const fontSize = active ? 12 : 10;
      context.font = `600 ${fontSize / scale}px Manrope, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillStyle = dark ? "#f5edf1" : "#261f23";
      context.fillText(
        node.title,
        node.x ?? 0,
        (node.y ?? 0) + radius + 3 / scale,
      );
    }
  }

  return (
    <div className="graph-experience">
      <div className="graph-toolbar">
        <div>
          <span className="eyebrow">Explore the connections</span>
          <h1>Knowledge graph</h1>
        </div>
        <div className="graph-actions">
          <label className="graph-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && focusMatches()}
              placeholder="Find a note or #tag"
            />
            {query && <span>{matches.length}</span>}
          </label>
          <button
            onClick={focusMatches}
            aria-label={
              matches.length ? "Focus search result" : "Fit graph to view"
            }
          >
            <Focus size={18} />
          </button>
          <button
            className={settingsOpen ? "active" : ""}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Graph settings"
            aria-expanded={settingsOpen}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      <div className="graph-stage" ref={containerRef}>
        <ForceGraph
          ref={graphRef}
          graphData={graph}
          width={size.width}
          height={size.height}
          backgroundColor={dark ? "#1a1619" : "#f8f5f7"}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, context) => {
            context.beginPath();
            context.arc(node.x ?? 0, node.y ?? 0, 9, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
          }}
          nodeLabel={(node) =>
            `${node.title}<br><small>${node.tags.map((tag) => `#${tag}`).join(" ") || node.episode}</small>`
          }
          linkLabel={(link) => link.label}
          linkColor={(link) =>
            link.kind === "tag"
              ? dark
                ? "#74616b"
                : "#ad9ca5"
              : dark
                ? "#44363e"
                : "#e4d9df"
          }
          linkWidth={(link) =>
            (link.kind === "tag" ? Math.min(link.weight, 3) : 0.7) *
            settings.linkWidth
          }
          linkLineDash={(link) => (link.kind === "episode" ? [3, 4] : null)}
          linkDirectionalParticles={settings.animate ? 1 : 0}
          linkDirectionalParticleWidth={(link) =>
            (link.kind === "tag" ? 1.8 : 1.1) * settings.linkWidth
          }
          linkDirectionalParticleSpeed={0.003}
          onNodeHover={(node) => setHovered(node?.id ? String(node.id) : null)}
          onNodeClick={(node) => router.push(`/notes/${node.slug}/`)}
          onEngineTick={() => {
            if (!forcesConfigured.current) applyForces();
          }}
          warmupTicks={80}
          cooldownTicks={120}
          minZoom={0.35}
          maxZoom={8}
        />
        <aside
          className={`graph-settings ${settingsOpen ? "open" : ""}`}
          aria-hidden={!settingsOpen}
        >
          <div className="graph-settings-header">
            <div>
              <span className="eyebrow">Display & physics</span>
              <h2>Graph controls</h2>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              aria-label="Close graph settings"
            >
              <X size={18} />
            </button>
          </div>

          <div className="graph-control-list">
            <GraphSlider
              label="Center force"
              value={settings.centerStrength}
              min={0}
              max={0.5}
              step={0.01}
              display={settings.centerStrength.toFixed(2)}
              onChange={(value) => updateSetting("centerStrength", value)}
            />
            <GraphSlider
              label="Repulsion"
              value={settings.repulsion}
              min={10}
              max={300}
              step={5}
              display={String(settings.repulsion)}
              onChange={(value) => updateSetting("repulsion", value)}
            />
            <GraphSlider
              label="Link distance"
              value={settings.linkDistance}
              min={20}
              max={160}
              step={2}
              display={`${settings.linkDistance}px`}
              onChange={(value) => updateSetting("linkDistance", value)}
            />
            <GraphSlider
              label="Line width"
              value={settings.linkWidth}
              min={0.25}
              max={4}
              step={0.25}
              display={`${settings.linkWidth.toFixed(2)}x`}
              onChange={(value) => updateSetting("linkWidth", value)}
            />
            <GraphSlider
              label="Node size"
              value={settings.nodeSize}
              min={0.5}
              max={2.5}
              step={0.1}
              display={`${settings.nodeSize.toFixed(1)}x`}
              onChange={(value) => updateSetting("nodeSize", value)}
            />
          </div>

          <div className="graph-switches">
            <label>
              <span>Always show labels</span>
              <input
                type="checkbox"
                checked={settings.labels}
                onChange={(event) =>
                  updateSetting("labels", event.target.checked)
                }
              />
            </label>
            <label>
              <span>Animate connections</span>
              <input
                type="checkbox"
                checked={settings.animate}
                onChange={(event) =>
                  updateSetting("animate", event.target.checked)
                }
              />
            </label>
          </div>

          <div className="graph-settings-footer">
            <button onClick={() => updateSetting("animate", !settings.animate)}>
              {settings.animate ? <Pause size={16} /> : <Play size={16} />}
              {settings.animate ? "Pause motion" : "Play motion"}
            </button>
            <button onClick={resetSettings}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </aside>
        <aside className="graph-legend" aria-label="Graph color key">
          <strong>Subtopics</strong>
          <div className="graph-legend-topics">
            {subtopicColors.map(([subtopic, color]) => (
              <span key={subtopic} title={subtopic}>
                <i className="color-dot" style={{ background: color }} />
                {subtopic}
              </span>
            ))}
          </div>
          <div className="graph-legend-lines">
            <span>
              <i className="solid-line" /> Shared tag
            </span>
            <span>
              <i className="dashed-line" /> Learning sequence
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function GraphSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="graph-slider">
      <span>
        <strong>{label}</strong>
        <output>{display}</output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
