"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";

export function PersonalTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    api
      .get<{ user: CurrentUser }>("/auth/me")
      .then((d) => {
        const p = d.user.profile;
        setForm({
          firstName: p?.firstName ?? "",
          lastName: p?.lastName ?? "",
          headline: p?.headline ?? "",
          bio: "",
          location: "",
          website: "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/user/profile", form);
      toast.success("Personal info saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4 text-violet-500" />
          Personal information
        </CardTitle>
        <CardDescription>
          Your name and headline appear on every resume you generate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
            disabled={loading}
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
            disabled={loading}
          />
        </div>
        <Field
          label="Headline"
          value={form.headline}
          onChange={(v) => setForm((f) => ({ ...f, headline: v }))}
          placeholder="Senior Frontend Engineer"
          disabled={loading}
        />
        <TextArea
          label="Bio"
          value={form.bio}
          onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
          rows={3}
          disabled={loading}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            placeholder="City, Country"
            disabled={loading}
          />
          <Field
            label="Website"
            value={form.website}
            onChange={(v) => setForm((f) => ({ ...f, website: v }))}
            placeholder="https://your-site.com"
            disabled={loading}
          />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
      />
    </div>
  );
}