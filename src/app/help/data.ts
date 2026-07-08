// Static help-center dataset. Designed to be replaced with API calls
// (GET /help-articles, GET /help-articles/:id, GET /help-articles/search?q=)
// when the backend HelpArticle model is wired up. Keep the shape close to
// what the future API DTO will return so the swap is mechanical.

export type HelpCategory =
  | "getting-started"
  | "resume"
  | "ai"
  | "ats"
  | "billing"
  | "export"
  | "account"
  | "security";

export type HelpArticle = {
  slug: string;
  title: string;
  excerpt: string;
  /** Plain-text body. Rich text can come later from the CMS. */
  body: string;
  category: HelpCategory;
  /** Approximate read time in minutes. */
  readTime: number;
  /** ISO date the article was last updated. */
  updatedAt: string;
  /** Tags surfaced in the article card. */
  tags?: string[];
};

export const HELP_CATEGORIES: {
  id: HelpCategory | "all";
  label: string;
  description: string;
}[] = [
  { id: "all", label: "All articles", description: "Browse every published article." },
  { id: "getting-started", label: "Getting started", description: "Set up your account and your first resume." },
  { id: "resume", label: "Resume builder", description: "Sections, templates, and edits." },
  { id: "ai", label: "AI writing", description: "Get the most out of AI suggestions." },
  { id: "ats", label: "ATS scoring", description: "Beat applicant tracking systems." },
  { id: "billing", label: "Billing & plans", description: "Pricing, invoices, and refunds." },
  { id: "export", label: "Export & download", description: "PDF, DOCX, and shareable links." },
  { id: "account", label: "Account settings", description: "Profile, email, and preferences." },
  { id: "security", label: "Security & privacy", description: "2FA, data, and account protection." },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "create-your-first-resume",
    title: "Create your first resume in under five minutes",
    excerpt:
      "A step-by-step walkthrough from sign-up to downloading your first PDF — designed for first-time users.",
    category: "getting-started",
    readTime: 4,
    updatedAt: "2026-05-12",
    tags: ["starter", "guide"],
    body: `ProFile AI is built so you can produce a clean, ATS-friendly resume in your first session — no template wrestling, no formatting cleanup.

**Step 1 — Create your account.** Sign up with email or Google. You can stay on the Free plan forever; Pro is only needed if you want unlimited AI generations and cover letters.

**Step 2 — Start a new resume.** From the dashboard, click "New resume". Pick a template that matches the role you're targeting — Modern for tech and product, Classic for finance and law, Creative for design and marketing.

**Step 3 — Fill in the basics.** Enter your contact info, a one-line headline, and a short summary. If you already have an old resume, paste it into the importer and ProFile AI will pre-fill the rest.

**Step 4 — Let AI draft your bullets.** Click the sparkle icon next to any experience or project. Give the AI the role title and a few rough notes; it returns three to five quantified bullet points you can edit.

**Step 5 — Run the ATS check.** Once your draft is solid, run an ATS scan against a target job description. Aim for a score of 80 or above before exporting.

**Step 6 — Export.** Click "Download PDF" or "Download DOCX" (Pro and Business only) and apply.`,
  },
  {
    slug: "write-better-ai-bullets",
    title: "How to write better bullets with the AI assistant",
    excerpt:
      "Prompt patterns that turn rough notes into recruiter-grade, metric-driven bullet points.",
    category: "ai",
    readTime: 5,
    updatedAt: "2026-04-22",
    tags: ["prompts", "bullets"],
    body: `The AI assistant works best when you give it a role, a rough activity, and a hint about impact. A good prompt has three ingredients.

**1. The role.** "Senior backend engineer", "product designer", or "growth marketer". This sets vocabulary and seniority expectations.

**2. The activity.** One or two rough notes about what you actually did. "Migrated our billing service to Stripe", "ran 20 user interviews", "set up the team's analytics pipeline".

**3. The impact (if you have it).** "Reduced checkout drop-off by 18%", "shipped to 200k users", "saved the team 4 hours/week". If you don't have a number yet, the AI will help you find one — or flag the bullet as needing more data.

**Common pitfalls to avoid.**

- Don't paste your entire resume into one prompt. The AI does better with focused, section-level requests.
- Don't accept the first suggestion blindly. Read it, tighten it, and replace jargon with plain verbs.
- Don't fabricate metrics. If you don't know a number, say so in your prompt and the AI will return a qualitative bullet instead.`,
  },
  {
    slug: "ats-score-explained",
    title: "Understanding your ATS score",
    excerpt:
      "What the 0-100 score actually measures, why it fluctuates, and how to push it above 80.",
    category: "ats",
    readTime: 6,
    updatedAt: "2026-06-01",
    tags: ["score", "optimization"],
    body: `Your ATS score is an estimate of how well a typical applicant tracking system will parse and rank your resume against a target job description.

**The score is composed of four parts.**

- **Keyword match (40%).** Hard skills, tools, and certifications from the JD that appear in your resume.
- **Section completeness (20%).** Whether you have summary, experience, education, and skills sections.
- **Formatting safety (20%).** Tables, columns, headers, and icons that confuse parsers.
- **Quantification (20%).** Whether bullets include numbers, percentages, or scope.

**Why the score moves.** Even a one-word change to your summary can shift the score by 2-4 points. The score updates every time you save; you don't need to re-run the scan.

**How to push above 80.** Mirror the JD's exact phrasing in your skills section. Add a metric to every experience bullet. Remove tables and two-column layouts.`,
  },
  {
    slug: "compare-plans",
    title: "Free vs Pro vs Business: which plan do I need?",
    excerpt:
      "A practical decision guide based on your job-search volume and team setup.",
    category: "billing",
    readTime: 3,
    updatedAt: "2026-06-15",
    tags: ["pricing", "plans"],
    body: `The right plan depends on how often you're applying and whether you're working alone or with a team.

**Free is enough if** you have one target role, are applying selectively, and don't need cover letters or DOCX export. The 3 AI generations per month is plenty for a focused search.

**Pro is right if** you're applying to 5+ roles per month, want unlimited AI rewrites, and need cover letters. The application tracker also helps you stay organized when the search gets noisy.

**Business is right if** you're a career coach, recruiter, or part of a talent team. You get 5 seats, bulk tailoring, and custom branding on exported PDFs.`,
  },
  {
    slug: "cancel-or-refund",
    title: "How to cancel your subscription or request a refund",
    excerpt:
      "Step-by-step instructions plus the 14-day money-back guarantee policy.",
    category: "billing",
    readTime: 2,
    updatedAt: "2026-03-10",
    tags: ["refund", "cancel"],
    body: `**To cancel.** Go to Settings → Billing → Manage subscription → Cancel. Your plan stays active until the end of the current billing period. We don't pro-rate cancellations.

**To get a refund.** Email support@profileai.app within 14 days of your most recent charge. Include the email on your account. We process refunds within 5 business days.

**To pause instead of cancel.** You can switch to the Free plan at any time — your data, templates, and AI history stay intact.`,
  },
  {
    slug: "export-pdf-vs-docx",
    title: "PDF vs DOCX: which should I send?",
    excerpt:
      "When to use each format, and how to make sure your resume parses cleanly.",
    category: "export",
    readTime: 3,
    updatedAt: "2026-05-30",
    tags: ["format", "export"],
    body: `**Use PDF** for almost every application. PDFs preserve your formatting exactly, look identical on every device, and most modern ATS systems parse them well.

**Use DOCX** only when the job posting explicitly says "editable Word document" or when you want the recruiter to be able to copy/paste sections. DOCX is also the right format for staffing-agency intake forms.

**How to make sure your PDF parses.** Don't use the "save as PDF" print dialog — use the in-app "Download PDF" button, which produces a tagged, text-layer PDF.`,
  },
  {
    slug: "share-public-link",
    title: "Share a public link to your resume",
    excerpt:
      "Generate a recruiter-friendly URL, track views, and revoke access at any time.",
    category: "export",
    readTime: 3,
    updatedAt: "2026-06-22",
    tags: ["share", "link"],
    body: `Every resume has a public link at /r/<your-slug>. To enable it, open a resume, click "Share", and toggle "Public link" on. You can copy the link, send it via email, or share it on LinkedIn.

**Privacy controls.** You can turn off search engine indexing per resume from the share dialog. To revoke access entirely, toggle the link off — the URL will return a 404 immediately.

**Analytics.** Resume owners can see total views and the date of the most recent view. We don't track individual viewers beyond an anonymized hash.`,
  },
  {
    slug: "change-email",
    title: "How to change the email on your account",
    excerpt:
      "Update your login email and what happens to existing sessions.",
    category: "account",
    readTime: 2,
    updatedAt: "2026-02-14",
    tags: ["email", "settings"],
    body: `Go to Settings → Account → Email. Enter the new address, confirm your password, and we'll send a verification link to the new email. Until you click that link, the old email remains your login.

Once verified, all other sessions are signed out and you'll need to log back in with the new email.`,
  },
  {
    slug: "enable-two-factor-auth",
    title: "Enable two-factor authentication",
    excerpt:
      "Add a second layer of protection with an authenticator app.",
    category: "security",
    readTime: 3,
    updatedAt: "2026-04-02",
    tags: ["2fa", "security"],
    body: `Two-factor authentication is available on all plans. To enable it:

1. Go to Settings → Security → Two-factor authentication.
2. Scan the QR code with an authenticator app (1Password, Authy, Google Authenticator, etc.).
3. Enter the 6-digit code to confirm.
4. Save the recovery codes shown on the next screen somewhere safe.

If you lose access to your authenticator, you can use a recovery code to log in. Each code works once.`,
  },
  {
    slug: "delete-account",
    title: "How to delete your account and data",
    excerpt:
      "Permanently remove your account, resumes, and analytics — and what happens to public links.",
    category: "security",
    readTime: 2,
    updatedAt: "2026-05-01",
    tags: ["delete", "privacy"],
    body: `Go to Settings → Account → Delete account. You'll be asked to type "DELETE" to confirm. Deletion is permanent and removes your account, all resumes, all versions, and all analytics.

Public links to your resumes will start returning a 404 immediately. We don't retain backups of deleted data after 30 days.`,
  },
  {
    slug: "import-existing-resume",
    title: "Import an existing resume",
    excerpt:
      "Paste a PDF or Word document and let ProFile AI pre-fill every section.",
    category: "resume",
    readTime: 3,
    updatedAt: "2026-04-18",
    tags: ["import", "migration"],
    body: `From the dashboard, click "Import resume". You can either upload a PDF or DOCX or paste plain text. The importer will attempt to detect sections (summary, experience, education, skills) and pre-fill the editor.

**Review everything.** The importer is good but not perfect. Always scan the result for missing dates, mis-ordered roles, or skills it missed. You can re-run the importer on the same file if you want to compare.`,
  },
  {
    slug: "tailor-resume-to-job-description",
    title: "Tailor your resume to a specific job description",
    excerpt:
      "A repeatable workflow for adjusting your base resume to each role you apply for.",
    category: "ats",
    readTime: 5,
    updatedAt: "2026-06-08",
    tags: ["tailor", "jd"],
    body: `Tailoring is the highest-leverage thing you can do in a job search. A single base resume sent to 50 roles will underperform 5 targeted resumes sent to 5 well-matched roles.

**The 10-minute tailoring workflow.**

1. Open the target JD and copy the full text.
2. In ProFile AI, open your base resume and click "Tailor to JD". Paste the description.
3. Review the suggested changes: reordered skills, a tighter summary, bullets reworded to mirror the JD's phrasing.
4. Accept the changes you like; revert the ones you don't.
5. Run an ATS scan to confirm the score is above 80.
6. Export.

Don't tailor for every single role — focus on roles where you genuinely want to be considered.`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(
  current: HelpArticle,
  limit = 3,
): HelpArticle[] {
  return HELP_ARTICLES.filter(
    (a) => a.slug !== current.slug && a.category === current.category,
  ).slice(0, limit);
}
