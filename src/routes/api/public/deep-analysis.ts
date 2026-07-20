import { createFileRoute } from "@tanstack/react-router";
import {
  MAX_INPUT_CHARS,
  isForeignOrigin,
  isRateLimited,
} from "@/lib/api-guard";

// Same-origin only: the app calls this route from its own pages, so there is no
// reason to advertise a permissive CORS policy on a paid endpoint.
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/public/deep-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (isForeignOrigin(request)) {
            return jsonResponse({ error: "Forbidden" }, 403);
          }
          if (isRateLimited(request)) {
            return jsonResponse(
              { error: "Too many requests. Please wait a moment." },
              429,
            );
          }

          const webhookUrl = process.env.N8N_WEBHOOK_URL;
          if (!webhookUrl) {
            return jsonResponse({ error: "N8N_WEBHOOK_URL is not configured" }, 500);
          }

          let body: { assessmentText?: unknown; lang?: unknown };
          try {
            body = await request.json();
          } catch {
            return jsonResponse({ error: "Invalid JSON body" }, 400);
          }

          const assessmentText = typeof body.assessmentText === "string" ? body.assessmentText : "";
          const lang = body.lang === "en" ? "en" : "ar";
          if (!assessmentText.trim()) {
            return jsonResponse({ error: "assessmentText is required" }, 400);
          }
          if (assessmentText.length > MAX_INPUT_CHARS) {
            return jsonResponse({ error: "assessmentText is too large" }, 413);
          }

          const message = `Output language: ${lang}\n\n${assessmentText}`;

          // Agent workflows can take 30–60s; allow up to 90s before aborting.
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 90_000);
          let upstream: Response;
          try {
            upstream = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            return jsonResponse(
              { error: `Webhook responded with ${upstream.status}`, details: text.slice(0, 500) },
              502,
            );
          }

          const contentType = upstream.headers.get("content-type") ?? "";
          let output = "";
          if (contentType.includes("application/json")) {
            const data: unknown = await upstream.json();
            if (Array.isArray(data) && data.length > 0 && typeof (data[0] as any)?.output === "string") {
              output = (data[0] as any).output;
            } else if (data && typeof data === "object" && typeof (data as any).output === "string") {
              output = (data as any).output;
            } else {
              output = typeof data === "string" ? data : JSON.stringify(data);
            }
          } else {
            output = await upstream.text();
          }

          return jsonResponse({ analysis: output });
        } catch (err) {
          console.error("[deep-analysis] error", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          return jsonResponse({ error: message }, 500);
        }
      },
    },
  },
});