"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CalendarClock, CheckCircle2, FileSearch, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateApplicationFromJob, useJob } from "@/lib/hooks/useJobs";

export default function JobWorkspacePage() {
  const id = String(useParams<{ id: string }>().id);
  const router = useRouter();
  const query = useJob(id);
  const track = useCreateApplicationFromJob();
  if (query.isLoading) return <Skeleton className="m-6 h-[34rem] rounded-[2rem]" />;
  if (!query.data) return <Card className="m-6 p-8">Job not found.</Card>;
  const job = query.data;
  const tracked = job.applications?.[0];

  const addToTracker = async () => {
    try {
      const application = await track.mutateAsync({ id: job.id, status: "PREPARING" });
      toast.success("Added to your application tracker");
      router.push(`/dashboard/applications/${application.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to tracker");
    }
  };

  return (
    <div className="space-y-6 px-4 pb-12 lg:px-6">
      <Button asChild variant="ghost" size="sm"><Link href="/dashboard/jobs"><ArrowLeft className="mr-2 size-4" />Job workspace</Link></Button>
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-[radial-gradient(circle_at_90%_5%,rgba(192,132,252,.26),transparent_30%),linear-gradient(135deg,#170a31,#2a1152_60%,#11081f)] p-6 text-white shadow-2xl shadow-violet-950/20 sm:p-8">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2"><Badge className="border-violet-300/20 bg-white/10 text-violet-100">{job.lifecycle.replaceAll("_", " ")}</Badge><span className="text-xs text-violet-200/65">{job.sourceName}</span></div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
            <p className="mt-2 text-lg text-violet-100/75">{job.company}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-violet-100/70">{job.location && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><MapPin className="size-3.5" />{job.location}</span>}<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{job.workplaceType.replaceAll("_", " ")}</span>{job.employmentType && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{job.employmentType}</span>}</div>
          </div>
          <div className="flex flex-wrap gap-2">{tracked ? <Button asChild className="rounded-full bg-white text-violet-950 hover:bg-violet-50"><Link href={`/dashboard/applications/${tracked.id}`}><CheckCircle2 className="mr-2 size-4" />Open application</Link></Button> : <Button onClick={addToTracker} disabled={track.isPending} className="rounded-full bg-white text-violet-950 hover:bg-violet-50"><BriefcaseBusiness className="mr-2 size-4" />{track.isPending ? "Adding…" : "Prepare application"}</Button>}{job.canonicalUrl && <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><a href={job.canonicalUrl} target="_blank" rel="noreferrer">Original listing <ArrowUpRight className="ml-2 size-4" /></a></Button>}</div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
        <Card className="border-violet-500/15"><CardHeader><CardTitle>Job description</CardTitle></CardHeader><CardContent><div className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{job.description}</div></CardContent></Card>
        <aside className="space-y-4">
          <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-violet-600" />Application desk</CardTitle></CardHeader><CardContent className="space-y-2"><WorkspaceAction href="/dashboard/career" icon={FileSearch} title="Check alignment" text="Find evidence gaps before editing." /><WorkspaceAction href="/dashboard/resumes" icon={BriefcaseBusiness} title="Tailor a resume" text="Choose a resume for this role." /><WorkspaceAction href="/dashboard/career" icon={Mail} title="Write outreach" text="Create a grounded, human draft." /></CardContent></Card>
          <Card className="border-violet-500/15"><CardContent className="space-y-3 p-5 text-sm"><p className="text-xs leading-5 text-muted-foreground">{job.freshness === "closed" ? "This listing is closed. Your application history is preserved." : job.freshness === "stale" ? "Source verification is over 14 days old. Check the original listing before applying." : job.freshness === "recent" ? "Recently verified at the source. Availability can still change." : "This private import has not been verified at the source. Check availability before applying."}</p><Meta icon={ShieldCheck} label="Visibility" value={job.sourceType === "MANUAL" || job.sourceType === "USER_URL" ? "Private import" : "Attributed source"} /><Meta icon={CalendarClock} label="Source verified" value={job.lastVerifiedAt ? new Date(job.lastVerifiedAt).toLocaleDateString() : "Not verified"} />{job.expiresAt && <Meta icon={CalendarClock} label="Deadline" value={new Date(job.expiresAt).toLocaleDateString()} />}</CardContent></Card>
        </aside>
      </div>
    </div>
  );
}

function WorkspaceAction({ href, icon: Icon, title, text }: { href: string; icon: typeof FileSearch; title: string; text: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.div whileHover={reducedMotion ? undefined : { x: 3 }}><Link href={href} className="flex gap-3 rounded-xl border border-violet-500/10 bg-background/70 p-3 transition hover:border-violet-500/25"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600"><Icon className="size-4" /></span><span><span className="block text-sm font-medium">{title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{text}</span></span></Link></motion.div>;
}

function Meta({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600"><Icon className="size-4" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div></div>;
}
