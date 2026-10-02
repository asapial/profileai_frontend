"use client";

import { useState } from "react";
import Link from "next/link";


import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, Eye, Sparkles, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalTab } from "./PersonalTab";
import { ProfessionalTab } from "./ProfessionalTab";
import { SkillsTab } from "./SkillsTab";
import { PrivacyTab } from "./PrivacyTab";


const tabs = [
  { value: "personal", label: "Personal", icon: User },
  { value: "professional", label: "Professional", icon: BriefcaseBusiness },
  { value: "skills", label: "Skills", icon: Sparkles },
  { value: "privacy", label: "Privacy", icon: Eye },
] as const;

export default function ProfilePage() {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return "personal";
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return tabs.some((tab) => tab.value === requestedTab) ? requestedTab! : "personal";
  });


  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 md:p-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border pb-8"
      >


        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
          <div className="studio-eyebrow mb-4 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Your professional identity
          </div>
          <h1 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl">The story so far.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Keep your career story current and turn it into stronger resumes, cover letters, and recommendations.
          </p>
          </div>
          <Link
            href="/dashboard/career?tab=Career%20story"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Open Career Story
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.section>

      <Tabs value={value} onValueChange={setValue}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex h-auto w-max min-w-full gap-1 sm:min-w-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex items-center gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            {value === "personal" && <PersonalTab />}
            {value === "professional" && <ProfessionalTab />}
            {value === "skills" && <SkillsTab />}
            {value === "privacy" && <PrivacyTab />}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
