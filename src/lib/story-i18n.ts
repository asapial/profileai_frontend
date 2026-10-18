/**
 * Story copy for the landing cinema, in every supported locale.
 *
 * English mirrors the canonical data in `career-cinema.ts` (chapters,
 * captions) so the sampler invariants keep a single source of truth. Bengali
 * is a full translation of the story chrome and narration. In-world sample
 * documents (the resume sheet, job requirements, card titles, chips) stay in
 * English on purpose — they represent the user's own English resume content.
 */

import { CHAPTERS, SCENE_CAPTIONS, type ChapterMeta } from "./career-cinema";
import type { TemplateKey } from "./career-cinema";

export type StoryLocale = "en" | "bn";

export const STORY_LOCALES: { id: StoryLocale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "bn", label: "বাংলা" },
];

/** localStorage key for the visitor's explicit language choice. */
export const LOCALE_STORAGE_KEY = "profileai:story-locale";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
/** Localizes the ASCII digits inside a label (badges, counters, rail stops). */
export const bengaliDigits = (value: string) => value.replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]!);

export type StoryOutputAction = "download" | "share" | "register" | "track";

export type StoryNarrative = {
  eyebrow: string;
  title: string;
  body?: string;
  cue?: string;
};

export type StoryCopy = {
  locale: StoryLocale;
  chapters: ChapterMeta[];
  narratives: StoryNarrative[];
  captions: string[];
  storyPoints: string[][];
  /** Two-digit numerals for badges and counters, localized. */
  pad2: (value: number) => string;
  /** Localizes the match labels that travel with cards and job rows. */
  matchLabel: (label: string) => string;
  templateDescription: (template: TemplateKey) => string;
  hero: {
    promise: string;
    primary: string;
    secondary: string;
    play: string;
    stop: string;
    note: string;
    notePersonal: (name: string) => string;
  };
  startFree: string;
  skipStory: string;
  /** Story-chrome motion controls: stop or resume ambient drift. */
  pauseMotion: string;
  resumeMotion: string;
  meta: { left: string; language: string };
  rail: { label: string; chapter: (n: number, title: string) => string };
  gallery: { pick: string; previous: string; next: string; select: (name: string) => string };
  sheet: { selected: (name: string) => string };
  core: { you: string; universe: string };
  orb: { label: string };
  analysis: { title: string; checklist: string[]; note: string };
  job: { title: string; note: string };
  tailor: {
    kickerOriginal: string;
    titleOriginal: string;
    evidence: string;
    kickerSuggestion: string;
    titleSuggestion: string;
    legend: string;
    reject: string;
    rejectKept: string;
    accept: string;
    accepted: string;
    acceptChip: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
  };
  assembly: { title: string; steps: string[]; progress: string; docked: (count: number) => string; note: (name: string) => string };
  finalPanel: {
    title: string;
    rows: Record<StoryOutputAction, string>;
    statusIdle: string;
    statusCopied: string;
    statusFailed: string;
    statusPersonal: (name: string) => string;
  };
  final: { seal: string; headingTop: string; headingBottom: string; body: string; cta: string };
  reading: { cta: string };
  /** A4 progress spine. Zone ticks label themselves from section headings. */
  spine: { label: string };
  share: { title: (name: string) => string; text: string };
};

const EN_TEMPLATE_DESCRIPTIONS: Record<TemplateKey, string> = {
  editorial: "Timeless typography. Quiet presence.",
  technical: "Clear structure. Confident detail.",
  minimal: "Focused content. Room to breathe.",
  grid: "Distinct hierarchy. Modern rhythm.",
};

const EN_MATCH: Record<string, string> = {
  "Strong match": "Strong match",
  "No evidence": "No evidence",
  "Related experience": "Related experience",
  "Related work": "Related work",
};

const BN_MATCH: Record<string, string> = {
  "Strong match": "স্ট্রং ম্যাচ",
  "No evidence": "এভিডেন্স নেই",
  "Related experience": "সম্পর্কিত অভিজ্ঞতা",
  "Related work": "সম্পর্কিত কাজ",
};

const EN: StoryCopy = {
  locale: "en",
  chapters: CHAPTERS,
  narratives: [
    { eyebrow: "ACT I · UNDERSTAND ME", title: "Turn your experience into a resume built for the role.", body: "Connect your skills, projects and achievements. Build a career story grounded in evidence." },
    { eyebrow: "ACT I · EVIDENCE NETWORK", title: "Your experience starts making sense.", body: "ProfileAI connects related work, skills and outcomes without inventing missing details.", cue: "Every important claim stays connected to its source." },
    { eyebrow: "ACT II · STRUCTURED PROFILE", title: "Every claim keeps its source.", body: "Your work becomes structured, reusable evidence." },
    { eyebrow: "ACT II · JOB ALIGNMENT", title: "See the fit clearly.", body: "See what matches, what is missing, and what needs proof." },
    { eyebrow: "ACT III · AI TAILORING", title: "Improve the language without changing the truth.", body: "Every suggestion stays tied to evidence you already provided." },
    { eyebrow: "ACT III · RESUME STYLE", title: "Choose the presentation. Keep the substance." },
    { eyebrow: "ACT IV · LIVE ASSEMBLY", title: "Watch your evidence become a document.", body: "Confirmed sections flow into the layout you selected." },
    { eyebrow: "ACT IV · READY", title: "Your professional resume is ready." },
  ],
  captions: SCENE_CAPTIONS.map((caption) => caption.text),
  storyPoints: [
    ["Skills, projects, education and achievements gathered in one place", "A private core that stays yours", "Nothing invented: every signal keeps a source"],
    ["Related signals connect into clusters: skills, projects, experience, education, achievements", "Connection lines show how the story holds together", "Traces of the raw data stay visible around each cluster"],
    ["Connections become clean, traceable evidence cards", "Each card keeps a link to the source you confirmed", "Gaps stay visible instead of being filled in"],
    ["Paste a real job description and review coverage line by line", "Strong, partial and missing evidence are labelled", "No hiring probability, no guessing"],
    ["Generic lines become specific, grounded copy", "Suggestions stay anchored to your project evidence", "You accept, reject or edit every change"],
    ["Premium templates presented in depth", "One recommended style, chosen from your content", "Switch anytime — your words stay yours"],
    ["Each confirmed section flows into the document", "Order, spacing and hierarchy are handled for you", "Watch it build, section by section"],
    ["A polished, ATS-friendly resume, ready to send", "Download, share, start an application, track it", "One source of truth for your next move"],
  ],
  pad2: (value) => String(value).padStart(2, "0"),
  matchLabel: (label) => EN_MATCH[label] ?? label,
  templateDescription: (template) => EN_TEMPLATE_DESCRIPTIONS[template],
  hero: {
    promise: "From verified experience to a tailored resume and application.",
    primary: "Build my resume",
    secondary: "See how it works",
    play: "Play the tour",
    stop: "Stop the tour",
    note: "Illustrative profile · Your evidence. Your control.",
    notePersonal: (name) => `Signed in as ${name} · Your evidence. Your control.`,
  },
  startFree: "Start free",
  skipStory: "Skip to product details",
  pauseMotion: "Pause motion",
  resumeMotion: "Resume motion",
  meta: { left: "Resume intelligence", language: "Language" },
  rail: { label: "Product stages", chapter: (n, title) => `Stage ${n}: ${title}` },
  gallery: {
    pick: "Pick a resume style",
    previous: "Previous template",
    next: "Next template",
    select: (name) => `Select the ${name} resume template`,
  },
  sheet: { selected: (name) => `${name} · selected` },
  core: { you: "You", universe: "Your career universe" },
  orb: { label: "Grounded in your evidence" },
  analysis: {
    title: "Connecting your career data",
    checklist: ["Identifying key skills", "Mapping related projects", "Finding achievements", "Connecting source evidence", "Building your career network"],
    note: "Every connection starts with your work.",
  },
  job: { title: "Job description", note: "Match labels show evidence coverage, never hiring probability." },
  tailor: {
    kickerOriginal: "Your words",
    titleOriginal: "Original content",
    evidence: "Evidence: load performance improved 31%.",
    kickerSuggestion: "Clearer impact",
    titleSuggestion: "Tailored suggestion",
    legend: "Highlighted phrases are grounded in your evidence.",
    reject: "Reject",
    rejectKept: "Original kept",
    accept: "Accept suggestion",
    accepted: "Accepted ✓",
    acceptChip: "Added to your resume preview",
    statusPending: "Try the review. This is an illustrative example.",
    statusAccepted: "Tailored line added to your preview.",
    statusRejected: "Original wording kept in your preview.",
  },
  assembly: {
    title: "Assembling your resume",
    steps: ["Formatting content", "Optimizing layout", "Applying your style", "Finalizing document"],
    progress: "Live preview",
    docked: (count) => `Building your resume · ${count} of 5 sections`,
    note: (name) => `${name} template selected`,
  },
  finalPanel: {
    title: "Everything for your next move",
    rows: { download: "Download PDF", share: "Share resume", register: "Create application", track: "Track applications" },
    statusIdle: "Illustrative resume · Start free to create yours.",
    statusCopied: "Link copied to clipboard.",
    statusFailed: "Couldn't copy — use the address bar.",
    statusPersonal: (name) => `Signed in as ${name} · Your details are on the sheet.`,
  },
  final: {
    seal: "Ready for your review",
    headingTop: "Your experience.",
    headingBottom: "Ready for the next move.",
    body: "One source of truth, from your first career signal to your next application.",
    cta: "Create my resume",
  },
  reading: { cta: "Create my resume" },
  spine: { label: "Story progress" },
  share: { title: (name) => `${name} — Frontend Engineer`, text: "Preview from the ProfileAI career story." },
};

const BN: StoryCopy = {
  locale: "bn",
  chapters: [
    { kicker: "অধ্যায় ০১", title: "ক্যারিয়ার ইউনিভার্স", description: "আপনার স্কিল, অভিজ্ঞতা আর অর্জন — সব এক ডাইনামিক ক্যারিয়ার স্পেসে।" },
    { kicker: "অধ্যায় ০২", title: "এভিডেন্স নেটওয়ার্ক", description: "আপনার ক্যারিয়ার ডেটা জুড়ে গিয়ে গড়ে তোলে অর্থবহ ইন্টেলিজেন্স নেটওয়ার্ক।" },
    { kicker: "অধ্যায় ০৩", title: "স্ট্রাকচার্ড প্রোফাইল", description: "আপনার আসল কাজ সাজানো হয় যাচাইযোগ্য রেজুমে এভিডেন্সে।" },
    { kicker: "অধ্যায় ০৪", title: "জব অ্যালাইনমেন্ট", description: "যে চাকরিটা চান, তার সাথে আপনার অভিজ্ঞতার ম্যাচ দেখুন স্পষ্ট ইনসাইটে।" },
    { kicker: "অধ্যায় ০৫", title: "এআই টেইলরিং", description: "রেজুমে আরও শক্তিশালী আর ইমপ্যাক্টফুল করতে এআই-পাওয়ারড সাজেশন।" },
    { kicker: "অধ্যায় ০৬", title: "রেজুমে স্টাইল", description: "আপনার ইন্ডাস্ট্রি আর ক্যারিয়ার লক্ষ্যের জন্য ডিজাইন করা প্রফেশনাল টেমপ্লেট।" },
    { kicker: "অধ্যায় ০৭", title: "লাইভ অ্যাসেম্বলি", description: "আপনার ভেরিফায়েড কনটেন্ট সাজানো হয় বেছে নেওয়া টেমপ্লেটে।" },
    { kicker: "অধ্যায় ০৮", title: "প্রস্তুত", description: "পরিষ্কার, মডার্ন, ATS-ফ্রেন্ডলি রেজুমে — ডাউনলোড আর অ্যাপ্লাইয়ের জন্য প্রস্তুত।" },
  ],
  narratives: [
    { eyebrow: "অ্যাক্ট ১ · নিজেকে চিনুন", title: "অভিজ্ঞতা থেকে তৈরি হোক চাকরির রেজুমে।", body: "স্কিল, প্রজেক্ট আর অর্জন যুক্ত করুন। এভিডেন্সভিত্তিক ক্যারিয়ার স্টোরি তৈরি করুন।" },
    { eyebrow: "অ্যাক্ট ১ · এভিডেন্স নেটওয়ার্ক", title: "আপনার অভিজ্ঞতা অর্থবহ হয়ে ওঠে।", body: "ProfileAI সম্পর্কিত কাজ, স্কিল আর ফলাফল যুক্ত করে। হারানো তথ্য বানিয়ে বলে না।", cue: "প্রতিটি গুরুত্বপূর্ণ দাবি যুক্ত থাকে তার সোর্সের সঙ্গে।" },
    { eyebrow: "অ্যাক্ট ২ · স্ট্রাকচার্ড প্রোফাইল", title: "প্রতিটি দাবির পেছনে সোর্স থাকে।", body: "আপনার কাজ হয়ে ওঠে সাজানো, পুনর্ব্যবহারযোগ্য এভিডেন্স।" },
    { eyebrow: "অ্যাক্ট ২ · জব অ্যালাইনমেন্ট", title: "ম্যাচটি স্পষ্টভাবে দেখুন।", body: "কী মিলছে, কী বাদ পড়েছে, আর কোনটার প্রমাণ দরকার — স্পষ্ট দেখুন।" },
    { eyebrow: "অ্যাক্ট ৩ · এআই টেইলরিং", title: "ভাষা উন্নত হোক — সত্যটা অপরিবর্তিত।", body: "প্রতিটি সাজেশন আপনার দেওয়া এভিডেন্সের সঙ্গে যুক্ত থাকে।" },
    { eyebrow: "অ্যাক্ট ৩ · রেজুমে স্টাইল", title: "উপস্থাপন বেছে নিন। তথ্য একই রাখুন।" },
    { eyebrow: "অ্যাক্ট ৪ · লাইভ অ্যাসেম্বলি", title: "এভিডেন্সকে ডকুমেন্টে রূপ নিতে দেখুন।", body: "কনফার্ম করা সেকশন আপনার নির্বাচিত লেআউটে বসে যায়।" },
    { eyebrow: "অ্যাক্ট ৪ · প্রস্তুত", title: "আপনার প্রফেশনাল রেজুমে তৈরি।" },
  ],
  captions: [
    "প্রতিটি কার্ড আপনার কনফার্ম করা সোর্সের লিংক ধরে রাখে।",
    "হারিয়ে যাওয়া এভিডেন্স দৃশ্যমানই থাকে — কিছুই বানিয়ে বলা হয় না।",
    "রেজুমেতে যাওয়ার আগে প্রতিটি পরিবর্তন আপনি নিজে রিভিউ করেন।",
    "দেখুন, প্রতিটি সেকশন ডকুমেন্টে বসে যাচ্ছে।",
  ],
  storyPoints: [
    ["স্কিল, প্রজেক্ট, শিক্ষা আর অর্জন — সব এক জায়গায়", "প্রাইভেট কোর, যা শুধুই আপনার", "কিছুই বানানো নয়: প্রতিটি সিগন্যালের পেছনে সোর্স আছে"],
    ["সম্পর্কিত সিগন্যাল জোটে ক্লাস্টারে: স্কিল, প্রজেক্ট, অভিজ্ঞতা, শিক্ষা, অর্জন", "কানেকশন লাইন দেখায় গল্পটা কীভাবে জোড়া লাগে", "প্রতিটি ক্লাস্টারের চারপাশে কাঁচা ডেটার চিহ্ন দেখা যায়"],
    ["কানেকশনগুলো হয়ে ওঠে পরিষ্কার, ট্রেসযোগ্য এভিডেন্স কার্ড", "প্রতিটি কার্ড আপনার কনফার্ম করা সোর্সের লিংক ধরে রাখে", "ফাঁকা জায়গা ফাঁকাই থাকে — বানিয়ে ভরা হয় না"],
    ["আসল জব ডেসক্রিপশন পেস্ট করে লাইন ধরে কভারেজ দেখুন", "স্ট্রং, পার্শিয়াল আর মিসিং এভিডেন্স আলাদা লেবেল পায়", "কোনো হায়ারিং প্রোবাবিলিটি নয়, কোনো অনুমান নয়"],
    ["জেনেরিক লাইন হয়ে ওঠে নির্দিষ্ট, ভিত্তি-সমৃদ্ধ লেখা", "সাজেশন আঁকড়ে থাকে আপনার প্রজেক্ট এভিডেন্সে", "প্রতিটি পরিবর্তন আপনি গ্রহণ করুন, বাতিল করুন বা এডিট করুন"],
    ["প্রিমিয়াম টেমপ্লেট, গভীরভাবে উপস্থাপিত", "আপনার কনটেন্ট থেকে বেছে নেওয়া একটাই রেকমেন্ডেড স্টাইল", "যেকোনো সময় বদলান — আপনার লেখা আপনারই থাকে"],
    ["প্রতিটি কনফার্মড সেকশন ডকুমেন্টে গিয়ে মেশে", "অর্ডার, স্পেসিং আর হায়ারার্কি সামলে দেওয়া হয় আপনার হয়ে", "সেকশন ধরে ধরে তৈরি হতে দেখুন"],
    ["পরিপাটি, ATS-ফ্রেন্ডলি রেজুমে — পাঠানোর জন্য প্রস্তুত", "ডাউনলোড করুন, শেয়ার করুন, আবেদন শুরু করুন, ট্র্যাক করুন", "পরের ধাপের জন্য একটাই সোর্স অফ ট্রুথ"],
  ],
  pad2: (value) => bengaliDigits(String(value).padStart(2, "0")),
  matchLabel: (label) => BN_MATCH[label] ?? label,
  templateDescription: (template) => ({
    editorial: "কালজয়ী টাইপোগ্রাফি। শান্ত উপস্থিতি।",
    technical: "পরিষ্কার কাঠামো। আত্মবিশ্বাসী বিস্তারিত।",
    minimal: "ফোকাসড কনটেন্ট। শ্বাস নেওয়ার জায়গা।",
    grid: "স্বতন্ত্র হায়ারার্কি। আধুনিক রিদম।",
  })[template],
  hero: {
    promise: "যাচাই করা অভিজ্ঞতা থেকে টেইলরড রেজুমে ও জব অ্যাপ্লিকেশন।",
    primary: "রেজুমে তৈরি করুন",
    secondary: "কীভাবে কাজ করে দেখুন",
    play: "ট্যুর চালান",
    stop: "ট্যুর থামান",
    note: "ইলাস্ট্রেটিভ প্রোফাইল · আপনার এভিডেন্স। আপনার নিয়ন্ত্রণ।",
    notePersonal: (name) => `সাইন ইন করা আছে: ${name} · আপনার এভিডেন্স, আপনার নিয়ন্ত্রণ।`,
  },
  startFree: "ফ্রি শুরু করুন",
  skipStory: "প্রোডাক্টের বিস্তারিত দেখুন",
  pauseMotion: "মোশন থামান",
  resumeMotion: "মোশন চালু করুন",
  meta: { left: "রেজুমে ইন্টেলিজেন্স", language: "ভাষা" },
  rail: { label: "প্রোডাক্ট স্টেজ", chapter: (n, title) => `স্টেজ ${bengaliDigits(String(n))}: ${title}` },
  gallery: {
    pick: "রেজুমে স্টাইল বেছে নিন",
    previous: "আগের টেমপ্লেট",
    next: "পরের টেমপ্লেট",
    select: (name) => `${name} রেজুমে টেমপ্লেট নির্বাচন করুন`,
  },
  sheet: { selected: (name) => `${name} · নির্বাচিত` },
  core: { you: "আপনি", universe: "আপনার ক্যারিয়ার ইউনিভার্স" },
  orb: { label: "ভিত্তি: আপনার নিজের এভিডেন্স" },
  analysis: {
    title: "আপনার ক্যারিয়ার ডেটা সংযুক্ত হচ্ছে",
    checklist: ["মূল স্কিল চিহ্নিত করা", "সম্পর্কিত প্রজেক্ট মিলিয়ে নেওয়া", "অর্জন খুঁজে বের করা", "সোর্স এভিডেন্স যুক্ত করা", "ক্যারিয়ার নেটওয়ার্ক গড়ে তোলা"],
    note: "প্রতিটি সংযোগ শুরু হয় আপনার নিজের কাজ থেকে।",
  },
  job: { title: "জব ডেসক্রিপশন", note: "ম্যাচ লেবেল দেখায় এভিডেন্স কভারেজ — কখনোই চাকরি পাওয়ার সম্ভাবনা নয়।" },
  tailor: {
    kickerOriginal: "আপনার লেখা",
    titleOriginal: "মূল কনটেন্ট",
    evidence: "এভিডেন্স: লোড পারফরম্যান্স ৩১% উন্নত।",
    kickerSuggestion: "আরও স্পষ্ট ইমপ্যাক্ট",
    titleSuggestion: "টেইলরড সাজেশন",
    legend: "হাইলাইট করা অংশগুলো এসেছে আপনার এভিডেন্স থেকে।",
    reject: "বাতিল করুন",
    rejectKept: "মূল লেখা রাখা হয়েছে",
    accept: "সাজেশন গ্রহণ করুন",
    accepted: "গ্রহণ করা হয়েছে ✓",
    acceptChip: "রেজুমে প্রিভিউতে যোগ হয়েছে",
    statusPending: "রিভিউটা একবার চালিয়ে দেখুন — এটি একটি ইলাস্ট্রেটিভ উদাহরণ।",
    statusAccepted: "টেইলরড লাইনটি প্রিভিউতে যোগ হয়েছে।",
    statusRejected: "মূল লেখাটিই প্রিভিউতে রাখা হয়েছে।",
  },
  assembly: {
    title: "আপনার রেজুমে অ্যাসেম্বল হচ্ছে",
    steps: ["কনটেন্ট ফরম্যাট করা", "লেআউট অপটিমাইজ করা", "স্টাইল প্রয়োগ করা", "ডকুমেন্ট ফাইনাল করা"],
    progress: "লাইভ প্রিভিউ",
    docked: (count) => `রেজুমে তৈরি হচ্ছে · ৫টির মধ্যে ${bengaliDigits(String(count))}টি সেকশন`,
    note: (name) => `${name} টেমপ্লেট নির্বাচিত`,
  },
  finalPanel: {
    title: "আপনার পরের ধাপের সবকিছু",
    rows: { download: "PDF ডাউনলোড", share: "রেজুমে শেয়ার", register: "আবেদন তৈরি করুন", track: "আবেদন ট্র্যাক করুন" },
    statusIdle: "ইলাস্ট্রেটিভ রেজুমে · নিজেরটি বানাতে ফ্রি শুরু করুন।",
    statusCopied: "লিংক কপি হয়েছে।",
    statusFailed: "কপি করা গেল না — অ্যাড্রেস বার থেকে নিন।",
    statusPersonal: (name) => `সাইন ইন করা আছে: ${name} · শিটে আপনার তথ্য দেখুন।`,
  },
  final: {
    seal: "রিভিউয়ের জন্য প্রস্তুত",
    headingTop: "আপনার অভিজ্ঞতা।",
    headingBottom: "পরের ধাপের জন্য প্রস্তুত।",
    body: "প্রথম ক্যারিয়ার সিগন্যাল থেকে পরের অ্যাপ্লিকেশন — একটাই সোর্স অফ ট্রুথ।",
    cta: "আমার রেজুমে তৈরি করুন",
  },
  reading: { cta: "আমার রেজুমে তৈরি করুন" },
  spine: { label: "স্টোরি প্রগ্রেস" },
  share: { title: (name) => `${name} — Frontend Engineer`, text: "ProfileAI ক্যারিয়ার স্টোরি থেকে প্রিভিউ।" },
};

export const STORY_COPY: Record<StoryLocale, StoryCopy> = { en: EN, bn: BN };
