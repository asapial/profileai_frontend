export type PublicPageSlug =
  | "about"
  | "contact"
  | "blog"
  | "terms"
  | "privacy"
  | "cookies";

export type PublicPageIcon =
  | "sparkles"
  | "target"
  | "users"
  | "shield"
  | "briefcase"
  | "heart"
  | "timeline"
  | "mail"
  | "life-buoy"
  | "handshake"
  | "building"
  | "graduation"
  | "book"
  | "pen"
  | "chart"
  | "search"
  | "scale"
  | "file-check"
  | "accessibility"
  | "lock"
  | "database"
  | "eye"
  | "cookie"
  | "settings"
  | "clock";

export type PublicPageCard = {
  title: string;
  description: string;
  icon: PublicPageIcon;
  meta?: string;
  href?: string;
  linkLabel?: string;
};

export type PublicPageSection = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  paragraphs?: string[];
  bullets?: string[];
  cards?: PublicPageCard[];
  note?: string;
};

export type PublicPageDefinition = {
  slug: PublicPageSlug;
  accent: "violet" | "cyan" | "emerald" | "amber" | "rose";
  eyebrow: string;
  heroLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroPoints: string[];
  metrics: Array<{ value: string; label: string }>;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  sections: PublicPageSection[];
  closing: {
    eyebrow: string;
    title: string;
    description: string;
    label: string;
    href: string;
  };
};

export const PUBLIC_PAGE_CONTENT: Record<PublicPageSlug, PublicPageDefinition> = {
  about: {
    slug: "about",
    accent: "violet",
    eyebrow: "Company · About",
    heroLabel: "Why ProFile AI exists",
    heroTitle: "Career software should create clarity—not more pressure.",
    heroDescription:
      "We are building a thoughtful workspace that helps people explain their experience, make stronger decisions, and move through a job search with confidence.",
    heroPoints: [
      "AI assists; people approve every final word",
      "Useful guidance without opaque scoring or jargon",
      "Private career data stays under the user’s control",
    ],
    metrics: [
      { value: "60", label: "editable résumé & CV designs" },
      { value: "4", label: "connected career workflows" },
      { value: "Human", label: "always in control" },
      { value: "Private", label: "by default" },
    ],
    primaryCta: { label: "Build your first résumé", href: "/register" },
    secondaryCta: { label: "How we build", href: "#principles" },
    sections: [
      {
        id: "mission",
        eyebrow: "Our mission",
        title: "Make excellent career tools feel calm and accessible.",
        paragraphs: [
          "A job search asks people to translate years of work into a few pages, adapt that story for every opportunity, and navigate systems they rarely get to see. The process is repetitive, emotional, and unnecessarily fragmented.",
          "ProFile AI brings résumé creation, role-specific tailoring, ATS analysis, cover letters, application tracking, and export into one coherent workspace. The product removes busywork while preserving the judgment and voice that make every career story personal.",
        ],
        bullets: [
          "Turn rough experience into specific, evidence-led achievements.",
          "Explain ATS feedback in useful language—not mysterious scores.",
          "Keep documents, job context, and follow-ups connected.",
          "Let users inspect, edit, export, or delete what they create.",
        ],
      },
      {
        id: "principles",
        eyebrow: "Product principles",
        title: "The standards behind every feature.",
        description:
          "These principles guide product decisions, content design, and how we evaluate responsible AI assistance.",
        cards: [
          { title: "Human judgment first", description: "Suggestions remain drafts until the user reviews and approves them.", icon: "users", meta: "Control" },
          { title: "Evidence over hype", description: "We encourage accurate achievements, clear scope, and metrics that can be defended.", icon: "target", meta: "Trust" },
          { title: "Privacy by design", description: "Career information is treated as sensitive product data, never public content by default.", icon: "shield", meta: "Safety" },
          { title: "Calm, inclusive craft", description: "Readable interfaces, keyboard access, useful defaults, and reduced-motion support matter from day one.", icon: "heart", meta: "Quality" },
        ],
      },
      {
        id: "journey",
        eyebrow: "Our journey",
        title: "Building the connected career workspace.",
        cards: [
          { title: "The first problem", description: "Make résumé tailoring faster without turning applicants into generic AI copy.", icon: "sparkles", meta: "01 · Foundation" },
          { title: "The connected workflow", description: "Bring ATS feedback, cover letters, documents, and applications into one source of truth.", icon: "timeline", meta: "02 · Platform" },
          { title: "The template studio", description: "Offer 60 genuinely editable designs with private editions and reviewed community publishing.", icon: "file-check", meta: "03 · Craft" },
          { title: "What comes next", description: "Deeper role-fit guidance, stronger accessibility, and responsible collaboration for coaches and teams.", icon: "target", meta: "04 · Direction" },
        ],
      },
      {
        id: "careers",
        eyebrow: "Careers",
        title: "Do meaningful work for people doing difficult work.",
        paragraphs: [
          "We value thoughtful builders who care about product craft, privacy, reliability, and the real person behind every application. Our ideal teammates are comfortable moving between customer context and technical detail.",
          "We are not actively listing open positions today, but we welcome concise introductions from people whose work aligns with our mission.",
        ],
        cards: [
          { title: "Product & engineering", description: "Reliable systems, careful AI workflows, and interfaces that make complexity feel manageable.", icon: "briefcase", meta: "Future team" },
          { title: "Design & research", description: "Inclusive interaction design grounded in how people actually search, write, and apply.", icon: "search", meta: "Future team" },
          { title: "Customer experience", description: "Empathetic support, practical education, and feedback loops that improve the product.", icon: "life-buoy", meta: "Future team" },
        ],
        bullets: [
          "Flexible, async-friendly collaboration",
          "Clear ownership and written decision-making",
          "Respect for focused work and sustainable pace",
          "Direct exposure to customer problems and outcomes",
        ],
        note: "Interested in future opportunities? Send a short introduction and relevant work to careers@profileai.app. Please do not include sensitive identity or employment documents.",
      },
    ],
    closing: {
      eyebrow: "Build with us",
      title: "A stronger application starts with a clearer story.",
      description: "Experience the product principles in practice by creating your first private résumé workspace.",
      label: "Start free",
      href: "/register",
    },
  },

  contact: {
    slug: "contact",
    accent: "cyan",
    eyebrow: "Company · Contact",
    heroLabel: "Talk to a real team",
    heroTitle: "Start with the right channel. Get a useful answer faster.",
    heroDescription:
      "Whether you need product support, billing help, a responsible security channel, or a partnership conversation, we will route your message to the right owner.",
    heroPoints: [
      "Account and product support during weekdays",
      "Dedicated responsible-disclosure channel",
      "Programs for coaches, universities, and workforce teams",
    ],
    metrics: [
      { value: "<4h", label: "typical weekday first reply" },
      { value: "3", label: "specialist contact routes" },
      { value: "24/7", label: "security report intake" },
      { value: "Global", label: "remote-first support" },
    ],
    primaryCta: { label: "Email support", href: "mailto:support@profileai.app" },
    secondaryCta: { label: "Visit Help Center", href: "/help" },
    sections: [
      {
        id: "channels",
        eyebrow: "Contact channels",
        title: "Choose the fastest route for your question.",
        cards: [
          { title: "Product support", description: "Account access, résumé editing, templates, exports, ATS scans, or application tracking.", icon: "life-buoy", meta: "Weekdays · typically <4h", href: "mailto:support@profileai.app", linkLabel: "support@profileai.app" },
          { title: "Billing & subscriptions", description: "Invoices, plan changes, cancellations, refunds, or purchasing questions for a team.", icon: "mail", meta: "Weekdays · billing specialist", href: "mailto:billing@profileai.app", linkLabel: "billing@profileai.app" },
          { title: "Security reports", description: "Responsible vulnerability disclosure and urgent concerns about account or platform security.", icon: "shield", meta: "Monitored continuously", href: "mailto:security@profileai.app", linkLabel: "security@profileai.app" },
          { title: "Press & company", description: "Company background, product information, interviews, and media requests.", icon: "building", meta: "Response within 2 business days", href: "mailto:hello@profileai.app", linkLabel: "hello@profileai.app" },
        ],
      },
      {
        id: "what-to-expect",
        eyebrow: "What to expect",
        title: "A transparent support process from first message to resolution.",
        cards: [
          { title: "Share the essentials", description: "Include the account email, affected feature, and what you expected to happen.", icon: "mail", meta: "01" },
          { title: "We confirm ownership", description: "Sensitive account actions may require an identity or session verification step.", icon: "shield", meta: "02" },
          { title: "A specialist investigates", description: "Your request is routed by product area, urgency, and the data needed to reproduce it.", icon: "search", meta: "03" },
          { title: "You get a clear next step", description: "We explain the resolution, workaround, or realistic follow-up timeline in plain language.", icon: "file-check", meta: "04" },
        ],
        note: "Never send passwords, one-time codes, complete payment-card details, access tokens, or unredacted identity documents by email.",
      },
      {
        id: "partners",
        eyebrow: "Partners",
        title: "Bring a responsible career workspace to the people you support.",
        paragraphs: [
          "We work with organizations that help people navigate career transitions at scale. Partnership conversations focus on measurable outcomes, responsible data handling, accessible onboarding, and workflows that keep participants in control.",
        ],
        cards: [
          { title: "Career coaches", description: "Reusable review workflows, private client editions, and consistent document quality.", icon: "users", meta: "Independent & cohort programs" },
          { title: "Universities", description: "Career-center enablement for students, alumni, workshops, and employability programs.", icon: "graduation", meta: "Higher education" },
          { title: "Workforce programs", description: "Accessible tools for reskilling, return-to-work, and economic mobility initiatives.", icon: "handshake", meta: "Public & nonprofit" },
          { title: "Recruiting teams", description: "Candidate-readiness resources and structured collaboration without replacing human review.", icon: "building", meta: "Talent organizations" },
        ],
        bullets: [
          "Guided rollout and facilitator resources",
          "Privacy-conscious workspace configuration",
          "Usage and outcome reporting at an aggregate level",
          "Feedback channel with the product team",
        ],
        note: "Tell us about your audience, program size, timeline, and success measures at partnerships@profileai.app.",
      },
      {
        id: "responsible-disclosure",
        eyebrow: "Responsible disclosure",
        title: "Help us protect job seekers and their career data.",
        paragraphs: [
          "If you believe you found a security vulnerability, report it privately before sharing details publicly. Include reproducible steps, the affected surface, potential impact, and only the minimum data necessary to demonstrate the issue.",
        ],
        bullets: [
          "Do not access, modify, download, or retain another person’s data.",
          "Avoid denial-of-service testing, social engineering, or automated account creation.",
          "Allow reasonable time for investigation and remediation before disclosure.",
          "We will acknowledge credible reports and keep reporters informed of material progress.",
        ],
      },
    ],
    closing: {
      eyebrow: "Need an answer now?",
      title: "The Help Center may already have the exact walkthrough.",
      description: "Search twelve practical guides covering accounts, AI writing, ATS scoring, billing, privacy, and exports.",
      label: "Search Help Center",
      href: "/help",
    },
  },

  blog: {
    slug: "blog",
    accent: "rose",
    eyebrow: "Company · Career journal",
    heroLabel: "Practical career intelligence",
    heroTitle: "Useful guidance for the work between applications.",
    heroDescription:
      "Research-informed articles on résumé strategy, ATS systems, AI-assisted writing, interviewing, and building a job-search workflow you can sustain.",
    heroPoints: [
      "No keyword-stuffing shortcuts or fabricated metrics",
      "Examples written for real roles and career stages",
      "Product guidance connected to complete workflows",
    ],
    metrics: [
      { value: "4", label: "editorial pillars" },
      { value: "6", label: "featured field guides" },
      { value: "12", label: "product help deep-dives" },
      { value: "2×", label: "monthly career notes" },
    ],
    primaryCta: { label: "Read the latest", href: "#latest" },
    secondaryCta: { label: "Browse Help Center", href: "/help" },
    sections: [
      {
        id: "featured",
        eyebrow: "Featured field guide",
        title: "Build one strong résumé system—not thirty disconnected files.",
        paragraphs: [
          "The most effective tailoring workflow starts with a verified source résumé, a structured record of achievements, and a repeatable method for selecting evidence for each role. This guide explains how to create that system without flattening your voice into generic AI copy.",
        ],
        bullets: [
          "Create an evidence bank before editing layout or keywords.",
          "Map each job requirement to proof you can discuss in an interview.",
          "Use AI to rewrite and compare—not invent experience.",
          "Track which version was sent with every application.",
        ],
        note: "Field guide · Résumé strategy · 8 minute read",
      },
      {
        id: "latest",
        eyebrow: "Latest articles",
        title: "Six focused reads for a stronger search.",
        cards: [
          { title: "The evidence bank: your highest-leverage résumé habit", description: "Capture scope, outcomes, collaborators, constraints, and metrics before the details fade.", icon: "target", meta: "Résumé strategy · 6 min" },
          { title: "What an ATS can—and cannot—decide about you", description: "A plain-language guide to parsing, ranking, recruiter review, and where optimization becomes counterproductive.", icon: "chart", meta: "ATS systems · 7 min" },
          { title: "Five prompts that preserve your voice", description: "Use AI as an editor by supplying context, boundaries, evidence, and a clear review standard.", icon: "sparkles", meta: "Responsible AI · 5 min" },
          { title: "A follow-up system that respects everyone’s time", description: "Plan confirmation, thank-you, and decision follow-ups without turning your search into constant monitoring.", icon: "clock", meta: "Workflow · 4 min" },
          { title: "From responsibilities to interview-ready outcomes", description: "A practical framework for explaining impact when your work was collaborative, qualitative, or hard to measure.", icon: "pen", meta: "Writing · 6 min" },
          { title: "Choose a template for the hiring context", description: "Balance human readability, ATS compatibility, seniority, industry conventions, and the amount of evidence you need.", icon: "file-check", meta: "Templates · 5 min" },
        ],
      },
      {
        id: "topics",
        eyebrow: "Editorial pillars",
        title: "Explore the career questions we cover.",
        cards: [
          { title: "Résumé strategy", description: "Positioning, evidence, structure, tailoring, and writing achievements with integrity.", icon: "file-check", meta: "Write clearly" },
          { title: "ATS & hiring systems", description: "Understand parsing and screening without reducing your application to a score.", icon: "chart", meta: "Apply intelligently" },
          { title: "AI-assisted writing", description: "Prompts, review methods, accuracy boundaries, and keeping your own voice in the document.", icon: "sparkles", meta: "Stay in control" },
          { title: "Career workflows", description: "Application planning, follow-ups, interview preparation, reflection, and sustainable momentum.", icon: "timeline", meta: "Build a system" },
        ],
      },
      {
        id: "standards",
        eyebrow: "Editorial standards",
        title: "Advice should be specific, honest, and usable.",
        bullets: [
          "We distinguish product guidance, general career education, and claims that depend on an employer or jurisdiction.",
          "Examples avoid invented credentials, exaggerated metrics, and misleading certainty about hiring outcomes.",
          "Material product changes are reflected in Help Center documentation before related editorial promotion.",
          "Articles are reviewed for readability, accessibility, and practical next actions.",
        ],
      },
    ],
    closing: {
      eyebrow: "Career notes, without the noise",
      title: "Get two useful reads each month.",
      description: "Practical résumé guidance, hiring-system explainers, and thoughtful product updates—no daily inbox pressure.",
      label: "Join ProFile AI",
      href: "/register",
    },
  },

  terms: {
    slug: "terms",
    accent: "amber",
    eyebrow: "Legal · Terms of service",
    heroLabel: "Plain-language service terms",
    heroTitle: "Clear responsibilities for using ProFile AI.",
    heroDescription:
      "These terms explain account responsibilities, acceptable use, AI-assisted content, subscriptions, intellectual property, and how access may end.",
    heroPoints: [
      "Review every AI-assisted draft before using it",
      "Keep access credentials and account information secure",
      "Use the platform lawfully and respect other people’s rights",
    ],
    metrics: [
      { value: "18+", label: "standard account eligibility" },
      { value: "14 days", label: "stated refund request window" },
      { value: "You", label: "approve final application content" },
      { value: "2026", label: "current policy edition" },
    ],
    primaryCta: { label: "Read Privacy Policy", href: "/privacy" },
    secondaryCta: { label: "Contact us", href: "/contact" },
    sections: [
      {
        id: "acceptance",
        eyebrow: "01 · Agreement",
        title: "Acceptance and eligibility",
        paragraphs: [
          "By creating an account, purchasing a plan, or using ProFile AI, you agree to these terms and the policies linked from them. If you use the service for an organization, you confirm that you have authority to accept these terms for that organization.",
          "Individual accounts are intended for people old enough to enter a binding agreement where they live. If local law requires a higher age or guardian involvement, that requirement applies.",
        ],
      },
      {
        id: "accounts",
        eyebrow: "02 · Accounts",
        title: "Accurate information and secure access",
        bullets: [
          "Provide current registration and billing information.",
          "Protect passwords, recovery methods, sessions, and one-time codes.",
          "Notify support promptly if you suspect unauthorized access.",
          "Do not share individual-plan access or impersonate another person.",
        ],
      },
      {
        id: "ai-content",
        eyebrow: "03 · AI assistance",
        title: "Generated content remains a draft until you approve it.",
        paragraphs: [
          "AI suggestions may be incomplete, inaccurate, generic, or unsuitable for a particular employer. You are responsible for reviewing factual accuracy, tone, claims, dates, metrics, qualifications, and legal or professional requirements before use.",
          "ProFile AI does not guarantee interviews, employment, ATS ranking, or any hiring outcome. Scores and recommendations are decision-support tools, not employer decisions or professional legal advice.",
        ],
        note: "Never use generated content to fabricate employment, education, credentials, security clearances, achievements, or references.",
      },
      {
        id: "subscriptions",
        eyebrow: "04 · Billing",
        title: "Plans, renewals, cancellations, and refunds",
        bullets: [
          "Current price, billing interval, taxes, included limits, and renewal terms are shown before purchase.",
          "Subscriptions renew until cancelled through billing settings or the provided billing portal.",
          "Cancellation stops future renewal while access generally continues through the paid period.",
          "Refund requests submitted within the stated 14-day window are reviewed under the policy presented at purchase.",
        ],
      },
      {
        id: "acceptable-use",
        eyebrow: "05 · Acceptable use",
        title: "Use the service without harming people or systems.",
        bullets: [
          "Do not probe, disrupt, overload, bypass, reverse engineer, or gain unauthorized access to the service.",
          "Do not upload malware, unlawfully obtained data, or content that infringes privacy or intellectual-property rights.",
          "Do not automate abusive account creation, scraping, credential attacks, or deceptive employment activity.",
          "Do not resell or white-label access unless a written business agreement permits it.",
        ],
      },
      {
        id: "ownership",
        eyebrow: "06 · Ownership",
        title: "Your content stays yours; the product stays ours.",
        paragraphs: [
          "You retain rights in the career information and original content you provide. You give ProFile AI the limited permission needed to host, process, transform, and export that content to operate features you request.",
          "The platform, software, brand, interface, documentation, and system templates remain protected by applicable intellectual-property laws. Template customization does not transfer ownership of the underlying platform design system.",
        ],
      },
      {
        id: "termination",
        eyebrow: "07 · Service access",
        title: "Suspension, termination, and service changes",
        paragraphs: [
          "We may restrict access when reasonably necessary to protect users, investigate abuse, comply with law, address non-payment, or prevent material harm. Where practical, we provide notice and an opportunity to resolve the issue.",
          "You may stop using the service and request account deletion. Some records may be retained where required for security, payment reconciliation, dispute resolution, or legal obligations.",
        ],
      },
      {
        id: "accessibility",
        eyebrow: "Accessibility",
        title: "Core career workflows should work for more people.",
        paragraphs: [
          "Our design target is WCAG 2.2 Level AA for core navigation, creation, editing, account, and support experiences. This is an ongoing product commitment rather than a claim that every surface is already perfect.",
        ],
        cards: [
          { title: "Keyboard access", description: "Core actions should be reachable and understandable without a pointing device.", icon: "accessibility", meta: "Input" },
          { title: "Readable structure", description: "Semantic headings, labels, focus states, and useful assistive-technology announcements.", icon: "eye", meta: "Perception" },
          { title: "Motion & contrast", description: "Reduced-motion support, legible contrast, and information that does not depend on color alone.", icon: "settings", meta: "Preferences" },
        ],
        note: "Report an accessibility barrier at accessibility@profileai.app with the page, task, assistive technology, and browser involved. We will acknowledge the report and provide a practical response path.",
      },
    ],
    closing: {
      eyebrow: "Questions about these terms?",
      title: "We prefer clear questions to hidden assumptions.",
      description: "Contact the team for an accessible copy, billing clarification, or questions about using ProFile AI for an organization.",
      label: "Contact ProFile AI",
      href: "/contact",
    },
  },

  privacy: {
    slug: "privacy",
    accent: "emerald",
    eyebrow: "Legal · Privacy policy",
    heroLabel: "Privacy for career data",
    heroTitle: "Your career story is sensitive. We treat it that way.",
    heroDescription:
      "This policy explains what information ProFile AI processes, why it is needed, where service providers are involved, how long records are kept, and the choices available to you.",
    heroPoints: [
      "Personal résumé data is not sold",
      "Documents are private unless you choose to publish or share",
      "Account tools support access, export, correction, and deletion",
    ],
    metrics: [
      { value: "TLS", label: "encrypted data in transit" },
      { value: "Role", label: "based operational access" },
      { value: "Opt-in", label: "public template publishing" },
      { value: "You", label: "control account choices" },
    ],
    primaryCta: { label: "Open account settings", href: "/dashboard/settings" },
    secondaryCta: { label: "Security overview", href: "#security" },
    sections: [
      {
        id: "information",
        eyebrow: "01 · Information",
        title: "What we process",
        cards: [
          { title: "Account information", description: "Name, email, verification state, authentication settings, plan, and communication preferences.", icon: "users", meta: "Identity & access" },
          { title: "Career content", description: "Profile details, résumés, CVs, cover letters, job descriptions, applications, projects, and references you provide.", icon: "briefcase", meta: "User content" },
          { title: "Product activity", description: "Feature use, limits, exports, template choices, support history, and reliability diagnostics.", icon: "chart", meta: "Operations" },
          { title: "Technical context", description: "Device, browser, IP-derived security context, session records, and audit events needed to protect the service.", icon: "shield", meta: "Security" },
        ],
      },
      {
        id: "uses",
        eyebrow: "02 · Purpose",
        title: "Why information is used",
        bullets: [
          "Provide the account, résumé, AI writing, ATS analysis, export, and application-tracking features you request.",
          "Authenticate users, prevent fraud and abuse, enforce limits, and investigate security events.",
          "Process payments, provide support, communicate service changes, and meet legal obligations.",
          "Understand aggregate reliability and improve workflows without selling personal résumé information.",
        ],
      },
      {
        id: "ai-processing",
        eyebrow: "03 · AI features",
        title: "How AI-assisted processing works",
        paragraphs: [
          "When you request an AI feature, the relevant instructions, career context, and job information are sent to the configured model service to produce the requested suggestion. Only the context needed for that operation should be included.",
          "AI output is returned as a draft. Users should remove unnecessary sensitive information from prompts and verify every generated statement before saving or exporting it.",
        ],
      },
      {
        id: "sharing",
        eyebrow: "04 · Service providers",
        title: "When information is shared",
        bullets: [
          "Infrastructure, database, storage, email, analytics, payment, and AI providers acting under service agreements.",
          "Administrators and support personnel with role-based access when needed to operate or secure the service.",
          "Authorities or other parties when required by law, to protect rights and safety, or during a properly structured business transaction.",
          "Recipients you choose when publishing a résumé link, submitting a community template, or exporting and sharing a document.",
        ],
        note: "Publishing is opt-in. A private résumé or saved template does not enter the public gallery unless you submit it and an administrator approves it.",
      },
      {
        id: "retention",
        eyebrow: "05 · Retention",
        title: "Keep data only as long as it serves a defined purpose.",
        paragraphs: [
          "Active account content is generally retained while the account remains open. Deletion requests remove or de-identify data subject to reasonable backup cycles, security records, payment reconciliation, legal obligations, and dispute-resolution needs.",
          "Different record types have different operational lifetimes. Support can explain the applicable category for a specific request.",
        ],
      },
      {
        id: "choices",
        eyebrow: "06 · Your choices",
        title: "Access, correct, export, unpublish, or delete.",
        bullets: [
          "Edit profile, résumé, application, and preference information from the dashboard.",
          "Export supported account and document data through product tools or a verified support request.",
          "Unpublish shared content and withdraw a template from community review where the workflow permits.",
          "Request account deletion and manage optional product or marketing communications.",
        ],
      },
      {
        id: "security",
        eyebrow: "Security",
        title: "Layered safeguards for accounts and career content.",
        cards: [
          { title: "Transport protection", description: "Encrypted connections protect data moving between browsers, APIs, and configured service providers.", icon: "lock", meta: "In transit" },
          { title: "Access controls", description: "Authentication, optional two-factor flows, device records, role checks, and limited administrative access.", icon: "shield", meta: "Identity" },
          { title: "Operational visibility", description: "Audit events, rate limits, queue health, error monitoring, and investigated security signals.", icon: "eye", meta: "Detection" },
          { title: "Recovery practices", description: "Backups, service isolation, incident triage, and responsible-disclosure channels support resilience.", icon: "database", meta: "Resilience" },
        ],
        bullets: [
          "Use a unique password and enable two-factor authentication when available.",
          "Never share one-time codes, session tokens, or account recovery links.",
          "Review active devices and report unexpected account activity promptly.",
          "Send vulnerability reports privately to security@profileai.app.",
        ],
        note: "No security program can promise absolute protection. We continuously improve controls based on product risk, observed events, and responsible reports.",
      },
    ],
    closing: {
      eyebrow: "Privacy question or request?",
      title: "Start with a verified, specific request.",
      description: "Tell us the account involved and whether you need access, correction, export, deletion, or clarification—never include your password or one-time code.",
      label: "Contact privacy support",
      href: "mailto:privacy@profileai.app",
    },
  },

  cookies: {
    slug: "cookies",
    accent: "cyan",
    eyebrow: "Legal · Cookie policy",
    heroLabel: "Browser storage, explained",
    heroTitle: "Small pieces of state that keep the product secure and usable.",
    heroDescription:
      "This policy explains essential cookies, preferences, optional measurement, retention, and the controls available in your browser and account.",
    heroPoints: [
      "Essential storage supports authentication and security",
      "Preference storage remembers choices such as theme",
      "Optional measurement should not sell personal résumé data",
    ],
    metrics: [
      { value: "Required", label: "authentication storage" },
      { value: "Optional", label: "aggregate analytics" },
      { value: "0", label: "résumé-data sales" },
      { value: "Browser", label: "level controls" },
    ],
    primaryCta: { label: "Review controls", href: "#controls" },
    secondaryCta: { label: "Read Privacy Policy", href: "/privacy" },
    sections: [
      {
        id: "categories",
        eyebrow: "Cookie categories",
        title: "What each category does",
        cards: [
          { title: "Strictly necessary", description: "Session continuity, authentication, CSRF protection, fraud prevention, load balancing, and security preferences.", icon: "lock", meta: "Required" },
          { title: "Functional preferences", description: "Theme, interface choices, dismissed notices, and other convenience settings you ask the product to remember.", icon: "settings", meta: "Product experience" },
          { title: "Product analytics", description: "Aggregate feature adoption, performance, and reliability signals used to understand and improve workflows.", icon: "chart", meta: "Optional where required" },
          { title: "Communications", description: "Attribution or campaign preferences associated with product updates, when enabled with appropriate choice.", icon: "mail", meta: "Optional" },
        ],
      },
      {
        id: "examples",
        eyebrow: "Practical examples",
        title: "How storage appears during a normal session",
        cards: [
          { title: "Sign-in session", description: "A protected identifier keeps you signed in and links requests to the correct authenticated session.", icon: "shield", meta: "Session" },
          { title: "Security state", description: "Short-lived values help validate sensitive actions and reduce cross-site request attacks.", icon: "lock", meta: "Short lived" },
          { title: "Theme preference", description: "A local preference lets the interface open in the visual mode you selected.", icon: "eye", meta: "Preference" },
          { title: "Usage measurement", description: "An optional identifier may connect page events into an aggregate product journey without containing résumé text.", icon: "chart", meta: "Analytics" },
        ],
      },
      {
        id: "controls",
        eyebrow: "Your controls",
        title: "Manage storage without losing track of the trade-offs.",
        bullets: [
          "Use browser settings to inspect, block, or remove site data for ProFile AI.",
          "Use available consent or preference controls for optional analytics and communications.",
          "Sign out on shared devices and clear site data if the browser should not retain session state.",
          "Remember that blocking essential cookies prevents authenticated dashboard features from working correctly.",
        ],
        note: "Browser menus vary. Search your browser settings for cookies, site data, tracking protection, or privacy controls.",
      },
      {
        id: "retention",
        eyebrow: "Retention",
        title: "Session, persistent, and local storage have different lifetimes.",
        paragraphs: [
          "Some values expire when a browser session ends; others remain for a defined period so a security or preference feature works across visits. Expiration may also occur when you sign out, revoke a session, change a preference, or clear browser data.",
          "We review storage purpose and lifetime as features change. Values that are no longer necessary should be removed or shortened in a future release.",
        ],
      },
      {
        id: "third-parties",
        eyebrow: "Third parties",
        title: "Service providers may set storage for requested functions.",
        paragraphs: [
          "Authentication, payment, support, infrastructure, or analytics providers may use their own storage when their component or service is active. Their processing is also governed by applicable service agreements and privacy disclosures.",
        ],
        bullets: [
          "Payment interfaces may use fraud-prevention and checkout storage.",
          "Authentication services may use session and verification storage.",
          "Support tools may remember an open conversation or help preference.",
          "Optional analytics may connect anonymous or pseudonymous events across a visit.",
        ],
      },
    ],
    closing: {
      eyebrow: "Need help with browser storage?",
      title: "Tell us the browser, device, and action that is not working.",
      description: "Support can explain which essential setting is involved without asking for passwords, one-time codes, or sensitive document content.",
      label: "Contact support",
      href: "/contact",
    },
  },
};
