import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  headingTag?: "h1" | "h2";
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  headingTag: Heading = "h2",
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="premium-kicker">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
      )}
      <Heading className="max-w-3xl text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
