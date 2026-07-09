"use client"

// Admin users table — minimal stand-in that uses the same shadcn
// primitives (`Card`, `Badge`, `Button`) as the user `DataTable`, so the
// overall tone matches. Replace the static rows with a TanStack Query
// fetch against `/admin/users` once the endpoint exists.

import {
  IconDotsVertical,
  IconShield,
  IconUser,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AdminUserRow = {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN"
  status: "Active" | "Invited" | "Suspended"
  resumes: number
}

const ROWS: AdminUserRow[] = [
  {
    id: "1",
    name: "Asif Apial",
    email: "asif@example.com",
    role: "ADMIN",
    status: "Active",
    resumes: 12,
  },
  {
    id: "2",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "USER",
    status: "Active",
    resumes: 7,
  },
  {
    id: "3",
    name: "Jordan Park",
    email: "jordan@example.com",
    role: "USER",
    status: "Invited",
    resumes: 0,
  },
  {
    id: "4",
    name: "Priya Shah",
    email: "priya@example.com",
    role: "USER",
    status: "Suspended",
    resumes: 3,
  },
]

const STATUS_VARIANT: Record<
  AdminUserRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  Active: "secondary",
  Invited: "outline",
  Suspended: "destructive",
}

export function AdminUsersTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>Recent users</CardTitle>
            <CardDescription>
              Latest account activity across the platform.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">User</th>
                <th className="py-2 text-left font-medium">Role</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-right font-medium">Resumes</th>
                <th className="py-2 text-right font-medium" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={row.role === "ADMIN" ? "default" : "outline"}>
                      {row.role === "ADMIN" ? (
                        <IconShield className="mr-1 size-3" />
                      ) : (
                        <IconUser className="mr-1 size-3" />
                      )}
                      {row.role}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={STATUS_VARIANT[row.status]}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {row.resumes}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Actions for ${row.name}`}
                    >
                      <IconDotsVertical />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}