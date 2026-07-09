// User dashboard home — the default landing for any authenticated USER
// role at `/dashboard`. Composition mirrors the original shadcn
// dashboard so colors / spacing / tone stay identical, but the
// `SectionCards`, `ChartAreaInteractive`, and `DataTable` are now
// isolated inside the `(user)` route group.

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

// Local sample data so this page renders even before the user-scoped
// analytics endpoint is wired in. The shadcn dashboard composition
// expects a `data.json` shape — we replicate the minimum fields used by
// the existing components. Replace with the analytics hook's return
// type once `/dashboard/summary` is live.
const data: never[] = []

export function UserDashboardView() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  )
}