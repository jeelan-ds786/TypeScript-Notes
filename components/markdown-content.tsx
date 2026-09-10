"use client";

import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MarkdownHeading } from "@/lib/markdown-headings";
import { MermaidDiagram } from "./mermaid-diagram";

function getTextContent(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(getTextContent).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) {
    return getTextContent(value.props.children);
  }
  return "";
}

export function MarkdownContent({
  content,
  headings = [],
}: {
  content: string;
  headings?: MarkdownHeading[];
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2({ children }) {
          const heading = headings.find(
            (item) =>
              item.depth === 2 && item.text === getTextContent(children),
          );
          return <h2 id={heading?.id}>{children}</h2>;
        },
        h3({ children }) {
          const heading = headings.find(
            (item) =>
              item.depth === 3 && item.text === getTextContent(children),
          );
          return <h3 id={heading?.id}>{children}</h3>;
        },
        code({ className, children, ...props }) {
          const value = String(children).replace(/\n$/, "");
          if (className === "language-mermaid")
            return <MermaidDiagram chart={value} />;
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
