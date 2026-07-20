import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import AnalysisMarkdown from "@/components/AnalysisMarkdown";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  PILLARS,
  T,
  levelFor,
  overallScore,
  pillarScores,
  type Answer,
  type Lang,
} from "@/lib/imtithal-data";


export const Route = createFileRoute("/")({
  component: ImtithalApp,
});

type Step = "landing" | "intake" | "assessment" | "results";

interface Intake {
  system: string;
  purpose: string;
  sector: string;
  data: string;
  decisions: "yes" | "no";
  vendor: string;
  mode: "entity" | "vendor";
}

const initialIntake: Intake = {
  system: "",
  purpose: "",
  sector: "government",
  data: "",
  decisions: "no",
  vendor: "",
  mode: "entity",
};

function ImtithalApp() {
  const [lang, setLang] = useState<Lang>("ar");
  const [step, setStep] = useState<Step>("landing");
  const [intake, setIntake] = useState<Intake>(initialIntake);
  const [pillarIdx, setPillarIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLang, setSummaryLang] = useState<Lang>("ar");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  /* Scroll to top on every step change and on every pillar change. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, pillarIdx]);

  const restart = () => {
    setStep("landing");
    setIntake(initialIntake);
    setPillarIdx(0);
    setAnswers({});
    setSummary(null);
    setSummaryError(false);
    setSummaryLoading(false);
  };

  const t = (o: { ar: string; en: string }) => o[lang];

  const submitAssessment = async () => {
    if (summaryLoading) return; // guard against double submit
    setSummary(null);
    setSummaryError(false);
    setSummaryLoading(true);
    setSummaryLang(lang);

    try {
      const scores = pillarScores(answers);
      const overallPct = overallScore(scores);
      const payload = {
        intake,
        pillars: scores.map(({ pillar, pct }) => ({
          id: pillar.id,
          name: lang === "ar" ? pillar.ar : pillar.en,
          score_pct: pct,
          questions: pillar.questions.map((q) => ({
            id: q.id,
            question: lang === "ar" ? q.ar : q.en,
            answer: answers[q.id] ?? "no",
          })),
        })),
        overall_pct: overallPct,
        level: levelFor(overallPct, lang),
        lang,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/public/generate-report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ payload }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { summary?: string };
      const text = (data.summary ?? "").trim();
      if (!text) {
        setSummaryError(true);
      } else {
        setSummary(text);
      }
    } catch (err) {
      console.error("Summary generation failed", err);
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
      setStep("results");
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <Header
        lang={lang}
        onToggle={() => setLang(lang === "ar" ? "en" : "ar")}
        onRestart={restart}
        showRestart={step !== "landing"}
        t={t}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {summaryLoading && (
          <FullScreenLoading lang={lang} />
        )}
        {!summaryLoading && (
          <>
        {step === "landing" && (
          <Landing lang={lang} t={t} onStart={() => setStep("intake")} />
        )}
        {step === "intake" && (
          <IntakeForm
            lang={lang}
            t={t}
            intake={intake}
            setIntake={setIntake}
            onBack={() => setStep("landing")}
            onNext={() => {
              setPillarIdx(0);
              setStep("assessment");
            }}
          />
        )}
        {step === "assessment" && (
          <Assessment
            lang={lang}
            t={t}
            pillarIdx={pillarIdx}
            setPillarIdx={setPillarIdx}
            answers={answers}
            setAnswers={setAnswers}
            onDone={submitAssessment}
            onBack={() => setStep("intake")}
          />
        )}
        {step === "results" && (
          <Results
            lang={lang}
            t={t}
            answers={answers}
            intake={intake}
            summary={summary}
            summaryError={summaryError}
            summaryLang={summaryLang}
            onRegenerate={submitAssessment}
          />
        )}
          </>
        )}
      </main>
      <footer className="no-print mx-auto max-w-5xl px-4 pb-10 pt-4 text-center text-xs text-muted-foreground">
        {t(T.landing.disclaimer)}
      </footer>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({
  lang,
  onToggle,
  onRestart,
  showRestart,
  t,
}: {
  lang: Lang;
  onToggle: () => void;
  onRestart: () => void;
  showRestart: boolean;
  t: (o: { ar: string; en: string }) => string;
}) {
  return (
    <header className="no-print sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {/* neutral shield glyph */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-semibold tracking-tight">
              {t(T.brand)}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {t(T.tagline)}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showRestart && (
            <button
              onClick={onRestart}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {t(T.restart)}
            </button>
          )}
          <button
            onClick={onToggle}
            aria-label="Toggle language"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-muted"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Landing ---------- */
function Landing({
  lang,
  t,
  onStart,
}: {
  lang: Lang;
  t: (o: { ar: string; en: string }) => string;
  onStart: () => void;
}) {
  return (
    <section className="mt-6 flex flex-col items-start gap-8 md:mt-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        {lang === "ar" ? "2026 · عام الذكاء الاصطناعي" : "2026 · Year of AI"}
      </div>
      <h1
        className={`max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl ${
          lang === "ar" ? "text-start" : ""
        }`}
      >
        {t(T.landing.headline)}
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        {t(T.landing.sub)}
      </p>
      <button
        onClick={onStart}
        className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition hover:brightness-110"
      >
        {t(T.landing.cta)}
      </button>
      <p className="max-w-2xl text-xs text-muted-foreground">
        {t(T.landing.disclaimer)}
      </p>
      <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-5">
        {PILLARS.map((p, i) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="text-xs font-medium text-accent-foreground/70">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {t(p)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Intake ---------- */
function IntakeForm({
  lang,
  t,
  intake,
  setIntake,
  onBack,
  onNext,
}: {
  lang: Lang;
  t: (o: { ar: string; en: string }) => string;
  intake: Intake;
  setIntake: (i: Intake) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);

  const upd = <K extends keyof Intake>(k: K, v: Intake[K]) => {
    setIntake({ ...intake, [k]: v });
  };

  /** Fields the user must fill before continuing. */
  const REQUIRED = ["system", "purpose", "data"] as const;
  type RequiredKey = (typeof REQUIRED)[number];

  const isEmpty = (k: RequiredKey) => intake[k].trim().length === 0;
  const invalid = REQUIRED.filter(isEmpty);
  const errorFor = (k: RequiredKey) =>
    showErrors && isEmpty(k) ? t(T.intake.requiredError) : undefined;

  const handleNext = () => {
    if (invalid.length > 0) {
      setShowErrors(true);
      // Move the user to the first field that needs attention.
      const el = document.getElementById(`intake-${invalid[0]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => el?.focus({ preventScroll: true }), 300);
      return;
    }
    onNext();
  };

  return (
    <section className="mx-auto max-w-2xl">
      <SectionTitle
        eyebrow={lang === "ar" ? "الخطوة ١" : "Step 1"}
        title={t(T.intake.title)}
      />
      <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 print-card">
        <Field
          id="intake-system"
          label={t(T.intake.system)}
          hint={t(T.intake.hints.system)}
          required
          requiredLabel={t(T.intake.requiredMark)}
          error={errorFor("system")}
        >
          <input
            id="intake-system"
            className="input"
            value={intake.system}
            onChange={(e) => upd("system", e.target.value)}
            aria-invalid={Boolean(errorFor("system"))}
          />
        </Field>

        <Field
          id="intake-purpose"
          label={t(T.intake.purpose)}
          hint={t(T.intake.hints.purpose)}
          required
          requiredLabel={t(T.intake.requiredMark)}
          error={errorFor("purpose")}
        >
          <textarea
            id="intake-purpose"
            className="input min-h-20"
            value={intake.purpose}
            onChange={(e) => upd("purpose", e.target.value)}
            aria-invalid={Boolean(errorFor("purpose"))}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field
            id="intake-sector"
            label={t(T.intake.sector)}
            hint={t(T.intake.hints.sector)}
          >
            <select
              id="intake-sector"
              className="input"
              value={intake.sector}
              onChange={(e) => upd("sector", e.target.value)}
            >
              {Object.entries(T.intake.sectors).map(([k, v]) => (
                <option key={k} value={k}>
                  {t(v)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="intake-vendor"
            label={t(T.intake.vendor)}
            hint={t(T.intake.hints.vendor)}
          >
            <input
              id="intake-vendor"
              className="input"
              value={intake.vendor}
              onChange={(e) => upd("vendor", e.target.value)}
            />
          </Field>
        </div>

        <Field
          id="intake-data"
          label={t(T.intake.data)}
          hint={t(T.intake.hints.data)}
          required
          requiredLabel={t(T.intake.requiredMark)}
          error={errorFor("data")}
        >
          <textarea
            id="intake-data"
            className="input min-h-20"
            value={intake.data}
            onChange={(e) => upd("data", e.target.value)}
            aria-invalid={Boolean(errorFor("data"))}
          />
        </Field>

        <Field label={t(T.intake.decisions)} hint={t(T.intake.hints.decisions)}>
          <div className="flex flex-wrap gap-2">
            {(["yes", "no"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={intake.decisions === v}
                onClick={() => upd("decisions", v)}
                className={`chip ${intake.decisions === v ? "chip-active" : ""}`}
              >
                {v === "yes" ? t(T.intake.yes) : t(T.intake.no)}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t(T.intake.mode)} hint={t(T.intake.hints.mode)}>
          <div className="flex flex-wrap gap-2">
            {(["entity", "vendor"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={intake.mode === v}
                onClick={() => upd("mode", v)}
                className={`chip ${intake.mode === v ? "chip-active" : ""}`}
              >
                {v === "entity" ? t(T.intake.modeEntity) : t(T.intake.modeVendor)}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {showErrors && invalid.length > 0 && (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {t(T.intake.requiredError)}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-ghost">
          {t(T.intake.back)}
        </button>
        <button onClick={handleNext} className="btn-primary">
          {t(T.intake.next)}
        </button>
      </div>
    </section>
  );
}

/* ---------- Assessment ---------- */
function Assessment({
  lang,
  t,
  pillarIdx,
  setPillarIdx,
  answers,
  setAnswers,
  onDone,
  onBack,
}: {
  lang: Lang;
  t: (o: { ar: string; en: string }) => string;
  pillarIdx: number;
  setPillarIdx: (n: number) => void;
  answers: Record<string, Answer>;
  setAnswers: (a: Record<string, Answer>) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const pillar = PILLARS[pillarIdx];
  const unanswered = pillar.questions.filter((q) => !answers[q.id]);
  const progress = ((pillarIdx + 1) / PILLARS.length) * 100;
  const isLast = pillarIdx === PILLARS.length - 1;

  const setA = (qid: string, a: Answer) => {
    setAnswers({ ...answers, [qid]: a });
  };

  const goNext = () => {
    if (unanswered.length > 0) {
      setShowErrors(true);
      const el = document.getElementById(`q-${unanswered[0].id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowErrors(false);
    if (!isLast) setPillarIdx(pillarIdx + 1);
    else onDone();
  };

  const goBack = () => {
    setShowErrors(false);
    if (pillarIdx > 0) setPillarIdx(pillarIdx - 1);
    else onBack();
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t(T.assess.pillarOf)} {pillarIdx + 1} {t(T.assess.of)} {PILLARS.length}
        </span>
        <span className="font-semibold text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {t(pillar)}
      </h2>

      <div className="mt-6 space-y-4">
        {pillar.questions.map((q, i) => {
          const missing = showErrors && !answers[q.id];
          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5 ${
                missing ? "border-destructive/60" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-base font-medium leading-relaxed text-foreground">
                    {t(q)}
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={t(T.assess.answerLegend)}
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {(
                      [
                        { v: "yes", label: T.assess.answerYes },
                        { v: "partial", label: T.assess.answerPartial },
                        { v: "no", label: T.assess.answerNo },
                      ] as const
                    ).map((opt) => {
                      const active = answers[q.id] === opt.v;
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setA(q.id, opt.v)}
                          className={`chip ${active ? "chip-active" : ""}`}
                        >
                          {t(opt.label)}
                        </button>
                      );
                    })}
                  </div>
                  {missing && (
                    <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                      {t(T.assess.unanswered)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showErrors && unanswered.length > 0 && (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {T.assess.unansweredCount[lang](unanswered.length)}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button onClick={goBack} className="btn-ghost">
          {t(T.assess.back)}
        </button>
        <button onClick={goNext} className="btn-primary">
          {isLast ? t(T.assess.submit) : t(T.assess.next)}
        </button>
      </div>
    </section>
  );
}

/* ---------- Scoring helpers ---------- */
function usePillarScores(answers: Record<string, Answer>) {
  return useMemo(() => pillarScores(answers), [answers]);
}

function statusColor(pct: number) {
  if (pct < 40) return "var(--status-red)";
  if (pct <= 70) return "var(--status-amber)";
  return "var(--status-green)";
}

/* ---------- Results ---------- */
function Results({
  lang,
  t,
  answers,
  intake,
  summary,
  summaryError,
  summaryLang,
  onRegenerate,
}: {
  lang: Lang;
  t: (o: { ar: string; en: string }) => string;
  answers: Record<string, Answer>;
  intake: Intake;
  summary: string | null;
  summaryError: boolean;
  summaryLang: Lang;
  onRegenerate: () => void;
}) {
  const scores = usePillarScores(answers);
  const overall = overallScore(scores);
  const level = levelFor(overall, lang);

  const radarData = scores.map((s) => ({
    pillar: t(s.pillar),
    value: s.pct,
  }));

  const [deepLoading, setDeepLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [deepLang, setDeepLang] = useState<Lang>(lang);
  const [deepError, setDeepError] = useState(false);
  const [deepCopied, setDeepCopied] = useState(false);
  const deepRef = useRef<HTMLDivElement | null>(null);

  /* Bring the analysis into view once it arrives — it renders well below the fold. */
  useEffect(() => {
    if (deepAnalysis && deepRef.current) {
      deepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [deepAnalysis]);

  const buildAssessmentText = () => {
    const sectorKey = intake.sector as keyof typeof T.intake.sectors;
    const sectorObj = T.intake.sectors[sectorKey] ?? T.intake.sectors.other;
    const sector = sectorObj[lang];
    const decisions =
      intake.decisions === "yes"
        ? lang === "ar" ? "نعم" : "Yes"
        : lang === "ar" ? "لا" : "No";
    const lines: string[] = [];
    lines.push(`System name: ${intake.system || "-"}`);
    lines.push(`Purpose: ${intake.purpose || "-"}`);
    lines.push(`Sector: ${sector}`);
    lines.push(`Data used: ${intake.data || "-"}`);
    lines.push(`Model or vendor: ${intake.vendor || "-"}`);
    lines.push(`Affects citizens: ${decisions}`);
    lines.push("");
    lines.push("Answers:");
    for (const p of PILLARS) {
      for (const q of p.questions) {
        const a = answers[q.id];
        const answerLabel = a === "yes" ? "Yes" : a === "partial" ? "Partial" : "No";
        const label = lang === "ar" ? q.ar : q.en;
        lines.push(`- ${label}: ${answerLabel}`);
      }
    }
    return lines.join("\n");
  };

  const runDeep = async () => {
    if (deepLoading) return; // guard against double-click
    // Move the user down to the pending panel immediately, so the wait is visible.
    window.setTimeout(() => {
      deepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    setDeepLoading(true);
    setDeepError(false);
    setDeepAnalysis(null);
    setDeepLang(lang);
    try {
      const assessmentText = buildAssessmentText();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/public/deep-analysis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ assessmentText, lang }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { analysis?: string };
      const text = (data.analysis ?? "").trim();
      if (!text) setDeepError(true);
      else setDeepAnalysis(text);
    } catch (err) {
      console.error("Deep analysis failed", err);
      setDeepError(true);
    } finally {
      setDeepLoading(false);
    }
  };

  const copyDeep = async () => {
    if (!deepAnalysis) return;
    try {
      await navigator.clipboard.writeText(deepAnalysis);
      setDeepCopied(true);
      setTimeout(() => setDeepCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const summaryStale = Boolean(summary) && summaryLang !== lang;
  const deepStale = Boolean(deepAnalysis) && deepLang !== lang;

  return (
    <section>
      <SectionTitle
        eyebrow={lang === "ar" ? "النتائج" : "Results"}
        title={t(T.results.title)}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="text-sm font-medium text-muted-foreground">
            {t(T.results.overall)}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
              {overall}
            </span>
            <span className="text-xl font-semibold text-muted-foreground sm:text-2xl">
              %
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            {level}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t(T.results.level)}
          </p>
          <button
            onClick={runDeep}
            disabled={deepLoading}
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deepLoading ? t(T.deep.running) : t(T.deep.button)}
          </button>
          <p className="no-print mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
            {t(T.deep.explain)}
          </p>
          <button
            onClick={() => window.print()}
            className="no-print mt-3 w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {t(T.results.print)}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
          <div className="radar-wrap h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{ fill: "var(--foreground)", fontSize: 10 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                  stroke="var(--border)"
                />
                <Radar
                  dataKey="value"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        {scores.map(({ pillar, pct }) => (
          <div
            key={pillar.id}
            className="pillar-card rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="text-xs font-medium leading-snug text-muted-foreground">
              {t(pillar)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: statusColor(pct) }}
              />
              <span className="text-2xl font-bold text-foreground">{pct}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: statusColor(pct) }}
              />
            </div>
          </div>
        ))}
      </div>

      {(summary || summaryError) && (
        <div className="exec-summary print-card mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
            {t(T.report.exec)}
          </div>
          <p className="mt-3 max-w-[70ch] text-[1.05rem] leading-[1.75] text-foreground">
            {summary ??
              (lang === "ar"
                ? `${T.report.execLine.ar(level)} الدرجة الإجمالية ${overall}%.`
                : `${T.report.execLine.en(level)} Overall score ${overall}%.`)}
          </p>
          {summaryStale && (
            <div className="no-print mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">
                {t(T.report.staleLang)}
              </span>
              <button
                onClick={onRegenerate}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-muted"
              >
                {t(T.report.regenerate)}
              </button>
            </div>
          )}
        </div>
      )}

      {deepLoading && (
        <div ref={deepRef} className="mt-10 flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 text-[0.95rem] text-muted-foreground shadow-[var(--shadow-card)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          {t(T.deep.loading)}
        </div>
      )}
      {deepError && !deepLoading && (
        <div
          role="alert"
          className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-5 text-[0.95rem] text-destructive"
        >
          {t(T.deep.error)}
        </div>
      )}
      {deepAnalysis && !deepLoading && (
        <div
          ref={deepRef}
          className="print-page-break print-card mt-10 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-8"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t(T.deep.title)}
            </h2>
            <button
              onClick={copyDeep}
              className="no-print rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              {deepCopied ? t(T.deep.copied) : t(T.deep.copy)}
            </button>
          </div>
          {deepStale && (
            <div className="no-print mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t(T.report.staleLang)}
              </span>
              <button
                onClick={runDeep}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-muted"
              >
                {t(T.report.regenerate)}
              </button>
            </div>
          )}
          <AnalysisMarkdown markdown={deepAnalysis} lang={deepLang} />
        </div>
      )}
    </section>
  );
}

/* ---------- Full-screen loading gate ---------- */
function FullScreenLoading({ lang }: { lang: Lang }) {
  const label = lang === "ar" ? "جارٍ توليد التقرير…" : "Generating report…";
  const sub =
    lang === "ar"
      ? "قد يستغرق ذلك بضع ثوانٍ."
      : "This may take a few seconds.";
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <div className="text-lg font-semibold text-foreground">{label}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

/* ---------- Small UI atoms ---------- */
function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">
        {eyebrow}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  requiredLabel,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  required?: boolean;
  requiredLabel?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className="flex h-full flex-col">
      <label htmlFor={id} className="block">
        <span className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          {label}
          {required && requiredLabel && (
            <span className="rounded px-1.5 py-0.5 text-[0.68rem] font-medium text-destructive">
              * {requiredLabel}
            </span>
          )}
        </span>
        {hint && (
          <span
            id={hintId}
            className="mb-2 block text-[0.82rem] leading-relaxed text-muted-foreground"
          >
            {hint}
          </span>
        )}
      </label>
      <div
        className="mt-auto"
        aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ") || undefined}
      >
        {children}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
