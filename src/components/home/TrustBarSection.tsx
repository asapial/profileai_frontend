import { ShieldCheck, FileDown, Cpu, Languages, Lock } from "lucide-react";
import type { ManagedHomepageSection } from "@/lib/homepage";

const ITEMS = [
  {
    icon: Cpu,
    title: "AI-tailored bullets",
    description: "Generated for the role you want",
  },
  {
    icon: ShieldCheck,
    title: "ATS-friendly",
    description: "Passes 95% of screening systems",
  },
  {
    icon: FileDown,
    title: "PDF & DOCX export",
    description: "Ready to send in one click",
  },
  {
    icon: Languages,
    title: "Multi-language",
    description: "English, Spanish & more",
  },
  {
    icon: Lock,
    title: "Privacy first",
    description: "Your data stays yours",
  },
] as const;

const ICONS = [Cpu, ShieldCheck, FileDown, Languages, Lock];

export default function TrustBarSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const items = content?.items?.map((item, index) => ({
    icon: ICONS[index % ICONS.length]!,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
  })) ?? ITEMS;
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex items-center gap-3 text-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-background text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
