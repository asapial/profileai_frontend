"use client";

import { useState } from "react";
import {
  Bell,
  KeyRound,
  Link2,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityTab } from "../profile/SecurityTab";
import { NotificationsTab } from "../profile/NotificationsTab";
import { ConnectionsTab } from "../profile/ConnectionsTab";
import { AccountTab } from "../profile/AccountTab";
import { DangerTab } from "../profile/DangerTab";

const tabs = [
  { value: "security", label: "Security", icon: KeyRound },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "connections", label: "Connected apps", icon: Link2 },
  { value: "account", label: "Billing", icon: Sparkles },
  { value: "danger", label: "Danger zone", icon: Trash2 },
] as const;

export default function SettingsPage() {
  const [value, setValue] = useState<string>("security");

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <SettingsIcon className="h-6 w-6 text-violet-500" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Authentication, alert preferences, connected accounts, billing, and
          account deletion. Personal info is managed in your Profile.
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