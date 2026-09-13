"use client";

import { FormEvent, useDeferredValue, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateJob, useJobs, type CreateJob } from "@/lib/hooks/useJobs";

const EMPTY: CreateJob = { title: "", company: "", description: "", location: "", canonicalUrl: "", workplaceType: "UNSPECIFIED", sourceName: "Manual import" };

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const query = useJobs(useDeferredValue(search));
  const create = useCreateJob();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateJob>(EMPTY);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const job = await create.mutateAsync(form);
      setForm(EMPTY);
      setOpen(false);
      toast.success(`${job.title} added to your workspace`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this job");
    }
  };

  return (
    <div className="space-y-7 px-4 pb-12 lg:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-[radial-gradient(circle_at_85%_10%,rgba(168,85,247,.28),transparent_32%),linear-gradient(135deg,#160b2d,#25104b_55%,#12091f)] p-6 text-white shadow-2xl shadow-violet-950/15 sm:p-8">
        <div className="absolute -right-12 -top-16 size-52 rounded-full border border-white/10 bg-white/5 blur-sm" />
        <div className="relative max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100">
            <Sparkles className="size-3.5" /> Opportunity desk
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Keep every promising role in one focused workspace.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100/70 sm:text-base">Import a job once, keep its context, and move into resume tailoring, outreach and follow-up without losing the thread.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setOpen(true)} className="rounded-full bg-white text-violet-950 hover:bg-violet-50">
              <Plus className="mr-2 size-4" /> Add a job
            </Button>
            <div className="flex items-center gap-2 text-xs text-violet-100/65"><ShieldCheck className="size-4" /> Private imports stay in your account</div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Saved opportunities</h2>
          <p className="text-sm text-muted-foreground">Review the source and freshness before you apply.</p>
        </div>
        <label className="relative block sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search role, company or location" />
        </label>
      </div>

      {query.isLoading ? <p className="text-sm text-muted-foreground">Loading your opportunities…</p> : query.data?.length ? (
        <motion.div layout className="grid gap-4 lg:grid-cols-2">
          {query.data.map((job, index) => (
            <motion.article key={job.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .04, .24) }}>
              <Card className="group h-full overflow-hidden border-violet-500/15 bg-gradient-to-br from-card via-card to-violet-500/[.045] transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-950/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/15 dark:text-violet-300"><BriefcaseBusiness className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div><h3 className="font-semibold leading-5">{job.title}</h3><p className="mt-1 text-sm text-muted-foreground">{job.company}</p></div>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{job.lifecycle.replaceAll("_", " ")}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {job.location && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><MapPin className="size-3" />{job.location}</span>}
                        <span className="rounded-full bg-muted px-2.5 py-1">{job.workplaceType.replaceAll("_", " ")}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1">{job.sourceName}</span>
                      </div>
                      <Link href={`/dashboard/jobs/${job.id}`} className="mt-5 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300">Open workspace <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.article>
          ))}
        </motion.div>
      ) : (
        <Card className="border-dashed border-violet-500/25"><CardContent className="grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><BriefcaseBusiness /></span><h3 className="mt-4 font-semibold">Build your opportunity shortlist</h3><p className="mt-1 text-sm text-muted-foreground">Paste the details of a role you want to evaluate.</p><Button onClick={() => setOpen(true)} variant="outline" className="mt-4">Add your first job</Button></div></CardContent></Card>
      )}

      <AnimatePresence>
        {open && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-violet-950/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="add-job-title" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-violet-500/20 bg-background p-6 shadow-2xl shadow-violet-950/30">
            <div className="flex items-start justify-between"><div><h2 id="add-job-title" className="text-xl font-semibold">Add a job to your workspace</h2><p className="mt-1 text-sm text-muted-foreground">Use truthful details from the original listing.</p></div><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close"><X className="size-4" /></Button></div>
            <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input required placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input required placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input placeholder="Location" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.workplaceType} onChange={(e) => setForm({ ...form, workplaceType: e.target.value as CreateJob["workplaceType"] })}><option value="UNSPECIFIED">Workplace not specified</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ON_SITE">On-site</option></select>
              <Input className="sm:col-span-2" type="url" placeholder="Original job URL (optional)" value={form.canonicalUrl ?? ""} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
              <textarea required minLength={20} className="min-h-48 rounded-xl border bg-background px-3 py-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-violet-500 sm:col-span-2" placeholder="Paste the full job description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={create.isPending} className="bg-violet-600 hover:bg-violet-700">{create.isPending ? "Adding…" : "Add to workspace"}</Button></div>
            </form>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
