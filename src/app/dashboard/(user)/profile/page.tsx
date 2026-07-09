"use client";

import { useState } from "react";
import {
  Bell,
  Eye,
  KeyRound,
  Link2,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalTab } from "./PersonalTab";
import { ProfessionalTab } from "./ProfessionalTab";
import { SkillsTab } from "./SkillsTab";
import { PrivacyTab } from "./PrivacyTab";
import { SecurityTab } from "./SecurityTab";
import { NotificationsTab } from "./NotificationsTab";
import { ConnectionsTab } from "./ConnectionsTab";
import { AccountTab } from "./AccountTab";
import { DangerTab } from "./DangerTab";

const tabs = [
  { value: "personal", label: "Personal", icon: User },
  { value: "professional", label: "Professional", icon: Sparkles },
  { value: "skills", label: "Skills", icon: Sparkles },
  { value: "privacy", label: "Privacy", icon: Eye },
  { value: "security", label: "Security", icon: KeyRound },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "connections", label: "Connected apps", icon: Link2 },
  { value: "account", label: "Billing", icon: Sparkles },
  { value: "danger", label: "Danger zone", icon: Trash2 },
] as const;

export default function ProfilePage() {
  const [value, setValue] = useState<string>("personal");

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profile & settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal info, security, and preferences.
        </p>
      </div>

      <Tabs value={value} onValueChange={setValue}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex h-auto w-max flex-wrap gap-1 sm:flex-nowrap">
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
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionsTab />
        </TabsContent>
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="danger">
          <DangerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}