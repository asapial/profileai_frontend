"use client";

import { useState } from "react";
import { Eye, Sparkles, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalTab } from "./PersonalTab";
import { ProfessionalTab } from "./ProfessionalTab";
import { SkillsTab } from "./SkillsTab";
import { PrivacyTab } from "./PrivacyTab";

const tabs = [
  { value: "personal", label: "Personal", icon: User },
  { value: "professional", label: "Professional", icon: Sparkles },
  { value: "skills", label: "Skills", icon: Sparkles },
  { value: "privacy", label: "Privacy", icon: Eye },
] as const;

export default function ProfilePage() {
  const [value, setValue] = useState<string>("personal");

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep the information used to build your resumes and cover letters
          up to date. Security and account preferences live in Settings.
        </p>
      </div>

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

        <TabsContent value="personal">
          <PersonalTab />
        </TabsContent>
        <TabsContent value="professional">
          <ProfessionalTab />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsTab />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
