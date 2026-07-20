import { createFileRoute } from "@tanstack/react-router";
import { MAX_INPUT_CHARS, isForeignOrigin, isRateLimited } from "@/lib/api-guard";

interface Payload {
  intake: Record<string, unknown>;
  pillars: Array<{
    id: string;
    name: string;
    score_pct: number;
    questions: Array<{ id: string; question: string; answer: string }>;
  }>;
  overall_pct: number;
  level: string;
  lang: "ar" | "en";
}

function systemPrompt(lang: "ar" | "en") {
  const language = lang === "ar" ? "Arabic" : "English";
  return `You are an AI governance analyst. Given an assessment of an AI system against SDAIA's AI Adoption Framework (five pillars, each scored), write a concise executive summary of 3–5 sentences covering the system's overall governance maturity, its main strength, and its most important area to improve. Write in ${language}. Return ONLY JSON: {"summary":"..."} — no markdown, no code fences, no other fields.`;
}

export const Route = createFileRoute("/api/public/generate-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (isForeignOrigin(request)) {
          return new Response("Forbidden", { status: 403 });
        }
        if (isRateLimited(request)) {
          return new Response("Too many requests", { status: 429 });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
        }

        let payload: Payload;
        try {
          const body = (await request.json()) as { payload: Payload };
          payload = body.payload;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }

        if (!payload || typeof payload !== "object") {
          return new Response("Missing payload", { status: 400 });
        }

        const serialized = JSON.stringify(payload);
        if (serialized.length > MAX_INPUT_CHARS) {
          return new Response("Payload too large", { status: 413 });
        }

        const lang = payload.lang === "en" ? "en" : "ar";

        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            system: systemPrompt(lang),
            messages: [
              {
                role: "user",
                content: "Here is the assessment payload: " + serialized,
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          return new Response(
            `Upstream error ${upstream.status}: ${errText.slice(0, 500)}`,
            { status: 502 },
          );
        }

        const data = (await upstream.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const raw = (data.content?.[0]?.text ?? "").trim();
        const cleaned = raw
          .replace(/^\s*```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();
        let summary = "";
        try {
          const parsed = JSON.parse(cleaned) as { summary?: string };
          summary = typeof parsed.summary === "string" ? parsed.summary : "";
        } catch {
          summary = "";
        }

        return new Response(JSON.stringify({ summary }), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});