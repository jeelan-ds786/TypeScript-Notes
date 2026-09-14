"use client";

import { Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.25;

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [panEnabled, setPanEnabled] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function renderChart() {
      try {
        const mermaid = (await import("mermaid")).default;
        const theme =
          document.documentElement.dataset.theme === "dark"
            ? "dark"
            : "neutral";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme,
        });
        const result = await mermaid.render(`mermaid-${id}`, chart);
        if (active) setSvg(result.svg);
      } catch {
        if (active) setError(true);
      }
    }

    renderChart();
    return () => {
      active = false;
    };
  }, [chart, id]);

  function zoomBy(amount: number) {
    setView((current) => ({
      ...current,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale + amount)),
    }));
  }

  function startDragging(event: PointerEvent<HTMLDivElement>) {
    if (!panEnabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    setDragging(true);
  }

  function moveDiagram(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setView((current) => ({
      ...current,
      x: drag.current!.originX + event.clientX - drag.current!.startX,
      y: drag.current!.originY + event.clientY - drag.current!.startY,
    }));
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setDragging(false);
  }

  function zoomWithWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }

  function resetView() {
    setView({ scale: 1, x: 0, y: 0 });
  }

  if (error) return <pre className="diagram-error">{chart}</pre>;
  if (!svg) return <div className="diagram-loading">Drawing diagram...</div>;

  return (
    <div className="mermaid">
      <div className="mermaid-toolbar" aria-label="Diagram controls">
        <button
          className={panEnabled ? "active" : ""}
          type="button"
          onClick={() => setPanEnabled((enabled) => !enabled)}
          aria-label="Toggle move mode"
          aria-pressed={panEnabled}
          title="Move diagram"
        >
          <Move size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-ZOOM_STEP)}
          disabled={view.scale <= MIN_SCALE}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <output aria-label="Zoom level">{Math.round(view.scale * 100)}%</output>
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={view.scale >= MAX_SCALE}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset diagram view"
          title="Reset view"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div
        className={`mermaid-viewport${panEnabled ? " can-pan" : ""}${dragging ? " dragging" : ""}`}
        onPointerDown={startDragging}
        onPointerMove={moveDiagram}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={zoomWithWheel}
      >
        <div
          className="mermaid-canvas"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
