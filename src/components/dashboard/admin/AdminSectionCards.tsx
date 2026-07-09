// Admin overview cards.
//
// Mirrors the visual language of `components/section-cards.tsx`
// (gradient backgrounds, `@container/card` grid) so the chrome stays
// consistent across the user and admin dashboards, but every label is
// rewritten for platform-admin metrics. Numbers are placeholders until
// the admin analytics endpoint is wired in.

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminSectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-violet-500/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12,348
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            New signups trending up <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Compared to last 30 days
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Resumes generated</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            48,201
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +14.6%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            AI generation at peak <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Above monthly forecast
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active subscriptions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            2,184
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +3.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Retention holding strong <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Churn under 2%</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Open support tickets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            37
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -12.4%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Backlog shrinking <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Median time to reply: 2h</div>
        </CardFooter>
      </Card>
    </div>
  )
}