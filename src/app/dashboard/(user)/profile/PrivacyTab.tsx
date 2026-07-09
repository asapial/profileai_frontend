"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Globe, Lock, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Privacy = {
  profilePublic: boolean;
  showEmail: boolean;
  showPhone: boolean;
  searchable: boolean;
  allowDownload: boolean;
};

export function PrivacyTab() {
  const [data, setData] = useState<Privacy | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Privacy>("/user/privacy")
      .then(setData)
      .catch(() =>
        setData({
          profilePublic: false,
          showEmail: false,
          showPhone: false,
          searchable: false,
          allowDownload: true,
        })
      );
  }, []);

  const toggle = (key: keyof Privacy) => () =>
    setData((d) => (d ? { ...d, [key]: !d[key] } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await api.patch("/user/privacy", data);
      toast.success("Privacy preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading privacy settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-violet-500" />
          Privacy & visibility
        </CardTitle>
        <CardDescription>
          Decide what recruiters and other ProfileAI users can see.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row
          icon={<Globe className="h-4 w-4" />}
          title="Public profile"
          description="Anyone with your share link can view your profile."
          checked={data.profilePublic}
          onChange={toggle("profilePublic")}
        />
        <Row
          icon={<Eye className="h-4 w-4" />}
          title="Show email on profile"
          description="Useful for direct outreach."
          checked={data.showEmail}
          onChange={toggle("showEmail")}
        />
        <Row
          icon={<Eye className="h-4 w-4" />}
          title="Show phone on profile"
          description="Only visible to verified recruiters."
          checked={data.showPhone}
          onChange={toggle("showPhone")}
        />
        <Row
          icon={<Eye className="h-4 w-4" />}
          title="Searchable in recruiter directory"
          description="Allow recruiters to discover your profile."
          checked={data.searchable}
          onChange={toggle("searchable")}
        />
        <Row
          icon={<Lock className="h-4 w-4" />}
          title="Allow resume downloads"
          description="Visitors can download your public resumes."
          checked={data.allowDownload}
          onChange={toggle("allowDownload")}
        />

        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save privacy settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Row({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-3 hover:border-violet-300">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative mt-1 h-5 w-9 shrink-0 rounded-full transition ${
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