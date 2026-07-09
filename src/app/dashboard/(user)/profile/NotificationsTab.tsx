"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from "@/lib/hooks/useNotificationPrefs";

export function NotificationsTab() {
  const { data } = useNotificationPrefs();
  const mut = useUpdateNotificationPrefs();

  // Invalidate on success
  useEffect(() => {
    if (mut.isSuccess) {
      toast.success("Notification preferences saved");
      mut.reset();
    }
  }, [mut]);

  type BoolPrefKey =
    | "emailMarketing"
    | "emailProduct"
    | "emailSecurity"
    | "emailResumeTips"
    | "pushEnabled"
    | "inAppEnabled";

  const toggle = (key: BoolPrefKey): (() => void) => {
    return () => {
      if (!data) return;
      mut.mutate({ [key]: !data[key] } as Partial<typeof data>);
    };
  };

  const setDigest = (v: "OFF" | "DAILY" | "WEEKLY") => {
    mut.mutate({ digestFrequency: v });
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading preferences…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-violet-500" />
          Notification preferences
        </CardTitle>
        <CardDescription>
          Choose how and when we contact you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title="Channels">
          <Switch
            label="In-app notifications"
            checked={data.inAppEnabled}
            onChange={toggle("inAppEnabled")}
          />
          <Switch
            label="Push notifications"
            checked={data.pushEnabled}
            onChange={toggle("pushEnabled")}
          />
        </Section>

        <Section title="Email topics">
          <Switch
            label="Product updates"
            checked={data.emailProduct}
            onChange={toggle("emailProduct")}
          />
          <Switch
            label="Resume tips & insights"
            checked={data.emailResumeTips}
            onChange={toggle("emailResumeTips")}
          />
          <Switch
            label="Marketing offers"
            checked={data.emailMarketing}
            onChange={toggle("emailMarketing")}
          />
          <Switch
            label="Security alerts"
            checked={data.emailSecurity}
            onChange={toggle("emailSecurity")}
            disabled
          />
        </Section>

        <Section title="Email digest">
          {(["OFF", "DAILY", "WEEKLY"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDigest(v)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                data.digestFrequency === v
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-border bg-background text-foreground hover:border-violet-300"
              }`}
            >
              {v}
            </button>
          ))}
        </Section>

        <p className="text-xs text-muted-foreground">
          Changes are saved automatically.
        </p>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between rounded-lg border border-border px-3 py-2 ${
        disabled ? "opacity-60" : "hover:border-violet-300"
      }`}
    >
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-violet-600" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}