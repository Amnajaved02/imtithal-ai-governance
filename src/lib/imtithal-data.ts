export type Lang = "ar" | "en";
export type Answer = "yes" | "partial" | "no";

export interface Question {
  id: string;
  ar: string;
  en: string;
  /** recommended evidence artifact if answer is No/Partial */
  gapAr: string;
  gapEn: string;
}

export interface Pillar {
  id: string;
  ar: string;
  en: string;
  questions: Question[];
}

export const PILLARS: Pillar[] = [
  {
    id: "data",
    ar: "حوكمة البيانات",
    en: "Data Governance",
    questions: [
      {
        id: "d1",
        ar: "هل تم تصنيف وجرد البيانات المستخدمة في تدريب وتشغيل النظام؟",
        en: "Is the data used to train and run the system classified and inventoried?",
        gapAr: "إعداد جرد وتصنيف رسمي للبيانات (Data Inventory & Classification)",
        gapEn: "Produce a formal data inventory and classification register",
      },
      {
        id: "d2",
        ar: "هل تتتبعون مصدر البيانات ومسار تدفقها؟",
        en: "Do you track data lineage?",
        gapAr: "توثيق مسار تدفق البيانات (Data Lineage Map)",
        gapEn: "Document end-to-end data lineage and flow diagrams",
      },
      {
        id: "d3",
        ar: "هل تتم معالجة البيانات الشخصية وفقاً لنظام حماية البيانات الشخصية مع تحديد مدد الاحتفاظ؟",
        en: "Is personal data handled per the PDPL with defined retention periods?",
        gapAr: "إعداد تقييم أثر حماية البيانات (DPIA) وسياسة احتفاظ",
        gapEn: "Prepare a DPIA and defined retention policy aligned with PDPL",
      },
    ],
  },
  {
    id: "model",
    ar: "المساءلة عن النماذج",
    en: "Model Accountability",
    questions: [
      {
        id: "m1",
        ar: "هل لكل نموذج مالك محدد بوضوح؟",
        en: "Does each model have a clearly named owner?",
        gapAr: "تعيين مالك مسؤول موثّق لكل نموذج (Model Ownership Register)",
        gapEn: "Assign a documented owner for every deployed model",
      },
      {
        id: "m2",
        ar: "هل تستخدمون إدارة الإصدارات وإدارة التغيير للنماذج؟",
        en: "Do you use version control and change management?",
        gapAr: "تطبيق إدارة إصدارات وسجل تغييرات للنماذج",
        gapEn: "Implement model version control and change management process",
      },
      {
        id: "m3",
        ar: "هل تحتفظون بسجلات تدقيق لتحديثات النماذج وعمليات نشرها؟",
        en: "Do you keep audit trails for updates and deployments?",
        gapAr: "تفعيل سجلات تدقيق (Audit Trails) للنشر والتحديث",
        gapEn: "Enable immutable audit trails for model updates and deployments",
      },
    ],
  },
  {
    id: "transparency",
    ar: "الشفافية",
    en: "Transparency",
    questions: [
      {
        id: "t1",
        ar: "هل يمكن تفسير القرارات التي تؤثر على المواطنين بوضوح؟",
        en: "Can decisions affecting citizens be explained clearly?",
        gapAr: "اعتماد أدوات وتقنيات تفسير القرارات (Explainability Report)",
        gapEn: "Adopt explainability techniques and publish an explanation report",
      },
      {
        id: "t2",
        ar: "هل تحتفظون بوثائق النماذج أو بطاقات تعريف النماذج؟",
        en: "Do you maintain model documentation or model cards?",
        gapAr: "إنشاء بطاقات تعريف للنماذج (Model Cards)",
        gapEn: "Create and maintain model cards for each model",
      },
      {
        id: "t3",
        ar: "هل تفصحون للمستخدمين عن المخاطر والقيود الجوهرية للنظام؟",
        en: "Do you disclose material risks and limitations to users?",
        gapAr: "نشر إفصاح رسمي عن مخاطر النظام وقيوده",
        gapEn: "Publish a user-facing disclosure of risks and limitations",
      },
    ],
  },
  {
    id: "human",
    ar: "الرقابة البشرية",
    en: "Human Oversight",
    questions: [
      {
        id: "h1",
        ar: "هل يوجد تدخل بشري في القرارات المهمة؟",
        en: "Is there a human in the loop for consequential decisions?",
        gapAr: "توثيق نقاط التدخل البشري (Human-in-the-Loop Policy)",
        gapEn: "Document a human-in-the-loop policy for consequential decisions",
      },
      {
        id: "h2",
        ar: "هل تم تدريب الموظفين على مراجعة مخرجات الذكاء الاصطناعي والاعتراض عليها؟",
        en: "Are staff trained to review and challenge AI outputs?",
        gapAr: "إعداد برنامج تدريب على مراجعة مخرجات الذكاء الاصطناعي",
        gapEn: "Deliver staff training on reviewing and challenging AI outputs",
      },
      {
        id: "h3",
        ar: "هل توجد قناة للاعتراض أو التظلم للأفراد المتأثرين؟",
        en: "Is there an appeal or redress channel for affected individuals?",
        gapAr: "إنشاء قناة تظلّم واعتراض موثّقة للأفراد المتأثرين",
        gapEn: "Establish a documented appeal and redress channel",
      },
    ],
  },
  {
    id: "risk",
    ar: "إدارة المخاطر",
    en: "Risk Management",
    questions: [
      {
        id: "r1",
        ar: "هل أجريتم تقييماً لمخاطر أو آثار الذكاء الاصطناعي؟",
        en: "Have you conducted an AI risk or impact assessment?",
        gapAr: "إجراء تقييم مخاطر / أثر الذكاء الاصطناعي (AI Impact Assessment)",
        gapEn: "Conduct a formal AI risk / impact assessment",
      },
      {
        id: "r2",
        ar: "هل لديكم آلية للاستجابة للحوادث وتسجيلها خاصة بالذكاء الاصطناعي؟",
        en: "Do you have AI-specific incident response and logging?",
        gapAr: "خطة استجابة لحوادث الذكاء الاصطناعي وسجل حوادث",
        gapEn: "Establish an AI-specific incident response plan and log",
      },
      {
        id: "r3",
        ar: "هل تتضمن عقود الموردين بنوداً للمسؤولية والأمن؟",
        en: "Do vendor contracts include liability and security clauses?",
        gapAr: "تحديث عقود الموردين لتشمل بنود المسؤولية والأمن السيبراني",
        gapEn: "Update vendor contracts with liability and security clauses",
      },
    ],
  },
];

export const T = {
  brand: { ar: "امتثال", en: "Imtithal" },
  tagline: {
    ar: "تقييم ذاتي لحوكمة الذكاء الاصطناعي",
    en: "AI Governance Self-Assessment",
  },
  langToggle: { ar: "EN", en: "عربي" },
  restart: { ar: "إعادة", en: "Restart" },
  landing: {
    headline: {
      ar: "قِس جاهزية نظام الذكاء الاصطناعي لديك مقابل إطار سدايا لتبني الذكاء الاصطناعي",
      en: "Measure your AI system's readiness against SDAIA's AI Adoption Framework",
    },
    sub: {
      ar: "عام 2026 هو عام الذكاء الاصطناعي في المملكة، ويستخدم نحو ٩٨٪ من موظفي القطاع العام أدوات الذكاء الاصطناعي، إلا أن كثيراً منهم يفتقرون إلى ضوابط الحوكمة اللازمة لتشغيلها بأمان.",
      en: "2026 is the Year of AI in the Kingdom. Around 98% of public-sector workers use AI tools, yet most still lack the governance controls to run them safely.",
    },
    cta: { ar: "ابدأ التقييم", en: "Start Assessment" },
    disclaimer: {
      ar: "أداة تقييم ذاتي استرشادية وليست شهادة اعتماد رسمية من سدايا.",
      en: "An informational self-assessment tool, not official SDAIA certification.",
    },
  },
  intake: {
    title: { ar: "بيانات النظام", en: "System Intake" },
    system: { ar: "اسم النظام", en: "System name" },
    purpose: { ar: "الغرض من النظام", en: "Purpose" },
    sector: { ar: "القطاع", en: "Sector" },
    data: { ar: "البيانات المستخدمة", en: "Data used" },
    decisions: {
      ar: "هل يتخذ النظام قرارات تؤثر على المواطنين؟",
      en: "Does it make decisions affecting citizens?",
    },
    vendor: { ar: "النموذج أو المورّد", en: "Model or vendor" },
    mode: { ar: "نوع الجهة", en: "Mode" },
    modeEntity: { ar: "جهة حكومية", en: "Government Entity" },
    modeVendor: { ar: "مورّد", en: "Vendor" },
    yes: { ar: "نعم", en: "Yes" },
    no: { ar: "لا", en: "No" },
    next: { ar: "التالي", en: "Next" },
    back: { ar: "السابق", en: "Back" },
    requiredMark: { ar: "مطلوب", en: "Required" },
    requiredError: { ar: "هذا الحقل مطلوب", en: "This field is required" },
    hints: {
      system: {
        ar: "الاسم الذي يُعرف به النظام داخل جهتكم، مثل: منصة خدمة المستفيدين.",
        en: "The name your organization uses for the system, e.g. Beneficiary Services Platform.",
      },
      purpose: {
        ar: "ما الذي يفعله النظام ومن المستفيد منه؟ جملة أو جملتان تكفيان.",
        en: "What the system does and who it serves. One or two sentences is enough.",
      },
      sector: {
        ar: "القطاع الذي تعمل فيه الجهة المشغّلة للنظام.",
        en: "The sector the organization operating the system works in.",
      },
      vendor: {
        ar: "اسم النموذج أو الجهة المزوّدة له، مثل: ALLaM، أو GPT-4، أو نموذج داخلي.",
        en: "The model or its provider, e.g. ALLaM, GPT-4, or an in-house model.",
      },
      data: {
        ar: "أنواع البيانات التي يستخدمها النظام، وهل تتضمن بيانات شخصية.",
        en: "The kinds of data the system uses, and whether any of it is personal data.",
      },
      decisions: {
        ar: "اختر «نعم» إذا كانت مخرجات النظام تؤثر على خدمة أو حق أو قرار يمسّ الأفراد.",
        en: "Choose Yes if the system's output affects a service, entitlement, or decision touching individuals.",
      },
      mode: {
        ar: "«جهة حكومية» إذا كنتم تشغّلون النظام، و«مورّد» إذا كنتم تزوّدونه لجهة أخرى.",
        en: "Government Entity if you operate the system; Vendor if you supply it to another organization.",
      },
    },
    sectors: {
      government: { ar: "حكومي", en: "Government" },
      health: { ar: "صحة", en: "Health" },
      education: { ar: "تعليم", en: "Education" },
      finance: { ar: "مالي", en: "Finance" },
      other: { ar: "أخرى", en: "Other" },
    },
  },
  assess: {
    pillarOf: { ar: "الركيزة", en: "Pillar" },
    of: { ar: "من", en: "of" },
    answerYes: { ar: "نعم", en: "Yes" },
    answerPartial: { ar: "جزئياً", en: "Partial" },
    answerNo: { ar: "لا", en: "No" },
    next: { ar: "التالي", en: "Next" },
    back: { ar: "السابق", en: "Back" },
    submit: { ar: "عرض النتائج", en: "View Results" },
    unanswered: {
      ar: "يرجى الإجابة على هذا السؤال قبل المتابعة",
      en: "Please answer this question before continuing",
    },
    unansweredCount: {
      ar: (n: number) =>
        n === 1 ? "بقي سؤال واحد بدون إجابة" : `بقي ${n} أسئلة بدون إجابة`,
      en: (n: number) =>
        n === 1 ? "1 question still unanswered" : `${n} questions still unanswered`,
    },
    answerLegend: { ar: "اختر إجابة", en: "Choose an answer" },
  },
  results: {
    title: { ar: "لوحة النتائج", en: "Results Dashboard" },
    overall: { ar: "الدرجة الإجمالية", en: "Overall Score" },
    level: { ar: "مستوى النضج", en: "Maturity Level" },
    print: { ar: "طباعة / حفظ PDF", en: "Print / Save as PDF" },
  },
  deep: {
    button: { ar: "تحليل معمّق", en: "Deep Analysis" },
    running: { ar: "جارٍ التحليل…", en: "Analyzing…" },
    loading: {
      ar: "الوكيل يحلّل… قد يستغرق حتى دقيقة",
      en: "Agent analyzing… this can take up to a minute",
    },
    error: {
      ar: "التحليل المعمّق غير متاح حالياً",
      en: "Deep analysis unavailable right now",
    },
    title: { ar: "التحليل المعمّق", en: "Deep Analysis" },
    copy: { ar: "نسخ", en: "Copy" },
    copied: { ar: "تم النسخ", en: "Copied" },
  },
  report: {
    exec: { ar: "الملخص التنفيذي", en: "Executive Summary" },
    execLine: {
      ar: (level: string) => `يبلغ مستوى نضج حوكمة الذكاء الاصطناعي للنظام: ${level}.`,
      en: (level: string) => `The AI governance maturity level of the system is: ${level}.`,
    },
    staleLang: {
      ar: "هذا المحتوى مُولّد بلغة أخرى.",
      en: "This content was generated in a different language.",
    },
    regenerate: { ar: "إعادة التوليد بالعربية", en: "Regenerate in English" },
  },
  levels: [
    { min: 0, max: 20, ar: "المستوى 1 · مبدئي", en: "Level 1 · Initial" },
    { min: 21, max: 40, ar: "المستوى 2 · قيد التطوير", en: "Level 2 · Developing" },
    { min: 41, max: 60, ar: "المستوى 3 · محدد", en: "Level 3 · Defined" },
    { min: 61, max: 80, ar: "المستوى 4 · مُدار", en: "Level 4 · Managed" },
    { min: 81, max: 100, ar: "المستوى 5 · محسّن", en: "Level 5 · Optimized" },
  ],
};

export function levelFor(pct: number, lang: Lang): string {
  const l = T.levels.find((x) => pct >= x.min && pct <= x.max) ?? T.levels[0];
  return l[lang];
}

export function scoreAnswer(a: Answer | undefined): number {
  if (a === "yes") return 2;
  if (a === "partial") return 1;
  return 0;
}

/** Single source of truth for per-pillar percentages. */
export function pillarScores(answers: Record<string, Answer>) {
  return PILLARS.map((pillar) => {
    const sum = pillar.questions.reduce(
      (n, q) => n + scoreAnswer(answers[q.id]),
      0,
    );
    const pct = Math.round((sum / (pillar.questions.length * 2)) * 100);
    return { pillar, pct };
  });
}

/** Overall percentage = mean of the five pillar percentages. */
export function overallScore(scores: Array<{ pct: number }>): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((s, x) => s + x.pct, 0) / scores.length);
}
