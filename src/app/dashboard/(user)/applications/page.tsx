"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageFeedback } from "@/components/dashboard/PageFeedback";
import { useApplicationPages, useCreateApplication, type Application } from "@/lib/hooks/useApplications";

const statuses: Application["status"][] = ["SAVED", "PREPARING", "APPLIED", "FOLLOW_UP_DUE", "RECRUITER_SCREEN", "INTERVIEW", "ASSESSMENT", "OFFER", "REJECTED", "WITHDRAWN"];
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");

export default function ApplicationsPage() {
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const query = useApplicationPages(status || undefined);
  const create = useCreateApplication();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending) return;
    const form = new FormData(event.currentTarget);
    const company = String(form.get("company") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    if (!company || !role) { toast.error("Company and role are required."); return; }
    try {
      await create.mutateAsync({ company, role, status: "SAVED" });
      setCreating(false);
      toast.success("Application added.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add application."); }
  }

  return <div className="space-y-6 p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Applications</h1><p className="text-sm text-muted-foreground">Track every application and its next step.</p></div>
      <div className="flex gap-2"><Button asChild variant="outline"><Link href="/dashboard/jobs">Browse jobs</Link></Button><Button onClick={() => setCreating((value) => !value)}>Add application</Button></div>
    </header>
    {creating && <Card><CardContent className="pt-6"><form onSubmit={add} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">Company<input required maxLength={120} name="company" className="rounded-md border bg-background p-2" /></label>
      <label className="grid gap-1 text-sm">Role<input required maxLength={120} name="role" className="rounded-md border bg-background p-2" /></label>
      <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save application"}</Button>
    </form></CardContent></Card>}
    <label className="flex items-center gap-3 text-sm">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border bg-background p-2"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    {query.isPending ? <PageFeedback loading /> : query.isError ? <PageFeedback error onRetry={() => void query.refetch()} /> : <>
      {items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">No applications match this status.</p> : <ul className="divide-y rounded-xl border">{items.map((item) => <li key={item.id}><Link href={`/dashboard/applications/${item.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40"><div><p className="font-medium">{item.role}</p><p className="text-sm text-muted-foreground">{item.company}</p></div><span className="text-sm capitalize">{label(item.status)}</span></Link></li>)}</ul>}
      {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more"}</Button>}
    </>}
  </div>;
}
