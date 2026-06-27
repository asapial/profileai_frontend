import {
  BadgeCheck,
  BarChart3,
  Brain,
  Download,
  FileText,
  Layers,
  LineChart,
  Lock,
  SearchCheck,
  Sparkles,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "ATS", href: "#ats" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
];

export const stats = [
  { label: "resumes generated", value: 42000 },
  { label: "avg ATS lift", value: 38, suffix: "%" },
  { label: "templates", value: 64 },
  { label: "export uptime", value: 99, suffix: "%" },
];

export const features = [
  {
    title: "AI resume writing",
    description: "Transform rough experience notes into targeted, quantified resume bullets.",
    icon: Brain,
  },
  {
    title: "ATS optimization",
    description: "Compare every resume against a job description and fill keyword gaps.",
    icon: SearchCheck,
  },
  {
    title: "Version history",
    description: "Save, compare, and restore resume changes for every target role.",
    icon: Layers,
  },
  {
    title: "PDF export",
    description: "Export clean, recruiter-ready PDFs using polished template rendering.",
    icon: Download,
  },
  {
    title: "Profile source of truth",
    description: "Maintain skills, education, projects, and experience once.",
    icon: FileText,
  },
  {
    title: "Privacy-first workflow",
    description: "Authentication, device controls, and account settings are built in.",
    icon: Lock,
  },
];

export const templates = [
  { name: "Executive Slate", category: "Modern", score: 92 },
  { name: "Classic Signal", category: "ATS", score: 96 },
  { name: "Creative Arc", category: "Creative", score: 84 },
  { name: "Compact Pro", category: "Classic", score: 89 },
];

export const workflow = [
  { title: "Complete profile", description: "Add career source data once.", icon: BadgeCheck },
  { title: "Choose template", description: "Pick a structure for the role.", icon: FileText },
  { title: "Generate with AI", description: "Create tailored resume content.", icon: Sparkles },
  { title: "Run ATS check", description: "Fix keywords and clarity gaps.", icon: BarChart3 },
  { title: "Export PDF", description: "Download and apply with confidence.", icon: Download },
];

export const testimonials = [
  {
    name: "Maya Chen",
    role: "Product Designer",
    quote: "ProFile AI helped me turn scattered project notes into a crisp portfolio resume in one evening.",
  },
  {
    name: "Daniel Reed",
    role: "Frontend Engineer",
    quote: "The ATS check was the difference maker. I could see what each job post needed before applying.",
  },
  {
    name: "Aisha Rahman",
    role: "Data Analyst",
    quote: "The templates feel professional without looking generic. I finally have a resume I like sending.",
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    description: "For one polished resume.",
    features: ["3 AI generations", "2 PDF exports", "ATS basics"],
  },
  {
    name: "Pro",
    price: "$19",
    description: "For active job seekers.",
    features: ["Unlimited resumes", "Advanced ATS checks", "Version history", "Premium templates"],
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    description: "For coaches and cohorts.",
    features: ["Shared template library", "Admin controls", "Usage analytics"],
  },
];

export const insightCards = [
  { label: "Keyword match", value: "82%", icon: LineChart },
  { label: "Readability", value: "A", icon: BadgeCheck },
  { label: "Action verbs", value: "24", icon: Sparkles },
];
