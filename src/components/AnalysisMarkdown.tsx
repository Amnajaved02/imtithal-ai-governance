import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Lang = "ar" | "en";

interface Props {
  markdown: string;
  lang: Lang;
}

/* The card already carries a "Starter Document" badge. If the agent emits its own
   label line as well, drop it rather than showing the heading twice. */
const REDUNDANT_LABEL_RE =
  /^\s*\**\s*(starter\s+document|filled(?:-in)?\s+starter\s+document|مستند\s+مبدئي|المستند\s+المبدئي)\s*[:：]?\s*\**\s*$/i;

// Regex for placeholders like [To be completed], [اسم الجهة], [DATE], {{name}}
const PLACEHOLDER_RE = /(\[[^\]\n]{2,80}\]|\{\{[^}\n]{2,80}\}\})/g;

// Priority patterns (EN + AR)
const PRIORITY_RE =
  /\b(?:priority\s*[:\-]?\s*)?(high|medium|low)\b(?:\s*priority)?/i;
const PRIORITY_AR_RE = /(?:الأولوية|أولوية)\s*[:\-]?\s*(عالية|متوسطة|منخفضة)/;

function priorityClasses(level: string): string {
  const l = level.toLowerCase();
  if (l === "high" || level === "عالية") {
    return "priority-badge bg-[color-mix(in_oklab,var(--status-red)_18%,transparent)] text-[oklch(0.42_0.16_27)] border border-[color-mix(in_oklab,var(--status-red)_35%,transparent)]";
  }
  if (l === "medium" || level === "متوسطة") {
    return "priority-badge bg-[color-mix(in_oklab,var(--status-amber)_22%,transparent)] text-[oklch(0.38_0.1_75)] border border-[color-mix(in_oklab,var(--status-amber)_40%,transparent)]";
  }
  return "priority-badge bg-[color-mix(in_oklab,var(--status-green)_20%,transparent)] text-[oklch(0.36_0.1_155)] border border-[color-mix(in_oklab,var(--status-green)_40%,transparent)]";
}

/** Recursively walk children; wrap placeholders and priority tokens in text nodes. */
function decorate(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return decorateString(children);
  }
  if (Array.isArray(children)) {
    return children.map((c, i) => (
      <span key={i} style={{ display: "contents" }}>
        {decorate(c)}
      </span>
    ));
  }
  return children;
}

function decorateString(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const ph = PLACEHOLDER_RE.exec(remaining);
    PLACEHOLDER_RE.lastIndex = 0;
    const enPr = PRIORITY_RE.exec(remaining);
    const arPr = PRIORITY_AR_RE.exec(remaining);

    // pick earliest match
    const candidates = [
      ph && { idx: ph.index, len: ph[0].length, kind: "ph" as const, text: ph[0] },
      enPr && { idx: enPr.index, len: enPr[0].length, kind: "pr" as const, text: enPr[0], level: enPr[1] },
      arPr && { idx: arPr.index, len: arPr[0].length, kind: "pr" as const, text: arPr[0], level: arPr[1] },
    ].filter(Boolean) as Array<{ idx: number; len: number; kind: "ph" | "pr"; text: string; level?: string }>;

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }
    candidates.sort((a, b) => a.idx - b.idx);
    const m = candidates[0];

    if (m.idx > 0) parts.push(remaining.slice(0, m.idx));
    if (m.kind === "ph") {
      parts.push(
        <span key={key++} className="placeholder-pill">
          {m.text}
        </span>,
      );
    } else {
      parts.push(
        <span key={key++} className={priorityClasses(m.level ?? "")}>
          {m.text}
        </span>,
      );
    }
    remaining = remaining.slice(m.idx + m.len);
  }
  return parts;
}

function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as any)) {
    return extractText((node as any).props.children);
  }
  return "";
}

function DocumentCard({ children, lang }: { children: ReactNode; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const raw = extractText(children);
  const badge = lang === "ar" ? "مستند مبدئي" : "Starter Document";
  const copyLabel = lang === "ar" ? "نسخ" : "Copy";
  const copiedLabel = lang === "ar" ? "تم النسخ" : "Copied";
  const downloadLabel = lang === "ar" ? "تنزيل" : "Download";

  /** Derive a filename from the document's first heading, falling back to a generic name. */
  const fileName = (() => {
    const firstHeading = raw
      .split("\n")
      .find((l) => l.trim().startsWith("#"));
    const title = (firstHeading ?? "").replace(/^#+\s*/, "").trim();
    const slug = title
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `${slug || (lang === "ar" ? "مستند-مبدئي" : "starter-document")}.md`;
  })();

  const download = () => {
    try {
      const blob = new Blob([raw], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="doc-card">
      <div className="flex items-start justify-between gap-3">
        <span className="doc-card-badge">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {badge}
        </span>
        <div className="no-print flex shrink-0 gap-2">
          <button
            onClick={copy}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            {copied ? copiedLabel : copyLabel}
          </button>
          <button
            onClick={download}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-muted"
          >
            {downloadLabel}
          </button>
        </div>
      </div>
      <div className="analysis-prose text-[0.98rem]">
        {children}
      </div>
    </div>
  );
}

export default function AnalysisMarkdown({ markdown, lang }: Props) {
  // Detect the agent's document delimiters. Support both fenced code blocks
  // ```document ... ``` / ```markdown ... ``` and explicit HTML-ish comments.
  // We rely on ReactMarkdown to parse; document cards are identified by
  // fenced code with language "document" | "doc" | "markdown" | "md".
  return (
    <div className="analysis-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            const asText = extractText(children).trim();
            if (REDUNDANT_LABEL_RE.test(asText)) return null;
            return <p>{decorate(children)}</p>;
          },
          li: ({ children }) => <li>{decorate(children)}</li>,
          h1: ({ children }) => <h1>{decorate(children)}</h1>,
          h2: ({ children }) => <h2>{decorate(children)}</h2>,
          h3: ({ children }) => <h3>{decorate(children)}</h3>,
          h4: ({ children }) => <h4>{decorate(children)}</h4>,
          td: ({ children }) => <td>{decorate(children)}</td>,
          th: ({ children }) => <th>{decorate(children)}</th>,
          strong: ({ children }) => <strong>{decorate(children)}</strong>,
          em: ({ children }) => <em>{decorate(children)}</em>,
          pre: ({ children }) => {
            // Inspect nested <code> to detect language
            const codeChild: any = Array.isArray(children) ? children[0] : children;
            const cls: string = codeChild?.props?.className ?? "";
            const raw = extractText(codeChild?.props?.children ?? "");
            const isDoc = /language-(document|doc|markdown|md|starter)/i.test(cls);
            if (isDoc) {
              return (
                <DocumentCard lang={lang}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw}</ReactMarkdown>
                </DocumentCard>
              );
            }
            return (
              <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                {children}
              </pre>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}