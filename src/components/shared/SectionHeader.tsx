import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  inverted?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  inverted = false,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-10 max-w-3xl", align === "center" ? "mx-auto text-center" : "")}>
      <Badge>{eyebrow}</Badge>
      <h2
        className={cn(
          "mt-4 text-2xl font-semibold leading-tight md:text-3xl",
          inverted ? "text-white" : "text-[--color-text-primary]"
        )}
      >
        {title}
      </h2>
      <p className={cn("mt-3 text-base leading-relaxed", inverted ? "text-white/70" : "text-[--color-text-body]")}>
        {description}
      </p>
    </div>
  );
}
