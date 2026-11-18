import type { HomepageConfig } from "@/lib/homepage";
import { PublicFooter } from "@/components/public/PublicFooter";

export function Footer({ content }: { content?: HomepageConfig["site"] }) {
  return <PublicFooter content={content} />;
}
