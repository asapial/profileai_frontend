import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Bullet = {
  title: string;
  body: string;
};

type Props = {
  title: string;
  subtitle: string;
  bullets?: Bullet[];
  /** Internal anchor for the "back to dashboard" CTA. */
  dashboardHref?: string;
};

export function AdminComingSoon({
  title,
  subtitle,
  bullets,
  dashboardHref = "/admin",
}: Props) {
  const items = bullets ?? [];
  return (
    <div className="flex min-w-0 flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Badge variant="outline" className="uppercase tracking-wide">
            Coming soon
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What this page will do</CardTitle>
          <CardDescription>
            The route is wired and reachable; the underlying views ship in a
            later milestone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              Detailed functionality will land here once the backend surface and
              UX specs are finalised.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((b) => (
                <li key={b.title} className="flex flex-col gap-1">
                  <span className="font-medium">{b.title}</span>
                  <span className="text-muted-foreground">{b.body}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={dashboardHref}>← Back to dashboard</Link>
        </Button>
        <p className="text-muted-foreground text-xs">
          Need this sooner? Track progress in the internal admin roadmap.
        </p>
      </div>
    </div>
  );
}
