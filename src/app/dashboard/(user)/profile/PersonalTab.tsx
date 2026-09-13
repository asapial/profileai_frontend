"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Link, MapPin, Phone, Save, User } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type UserProfileResponse = {
  profile: {
    firstName: string;
    lastName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    phone: string | null;
    linkedIn: string | null;
    avatarUrl: string | null;
  } | null;
};

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
    phone: "",
    linkedIn: "",
    avatarUrl: "",
  });

  useEffect(() => {
    api
      .get<UserProfileResponse>("/user/profile")
      .then((d) => {
        const p = d.profile;
        setForm({
          firstName: p?.firstName ?? "",
          lastName: p?.lastName ?? "",
          headline: p?.headline ?? "",
          bio: p?.bio ?? "",
          location: p?.location ?? "",
          website: p?.website ?? "",
          phone: p?.phone ?? "",
          linkedIn: p?.linkedIn ?? "",
          avatarUrl: p?.avatarUrl ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/profile", form);
      toast.success("Personal info saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
    <Card className="overflow-hidden border-violet-500/15 shadow-lg shadow-violet-500/5">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10">
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4 text-violet-500" />
          Personal information
        </CardTitle>
        <CardDescription>
          Your name and headline appear on every resume you generate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] p-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={form.avatarUrl} src={form.avatarUrl} alt="Profile avatar preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : (
              `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}` || <User className="h-8 w-8" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Profile photo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Paste a public image URL. A square image works best.</p>
            <div className="relative mt-3">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="url" value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://example.com/avatar.jpg" disabled={loading} className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
        </div>
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
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+880 1XXX-XXXXXX"
            disabled={loading}
            icon={Phone}
          />
          <Field
            label="LinkedIn"
            value={form.linkedIn}
            onChange={(v) => setForm((f) => ({ ...f, linkedIn: v }))}
            placeholder="https://linkedin.com/in/username"
            disabled={loading}
            icon={Link}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            placeholder="City, Country"
            disabled={loading}
            icon={MapPin}
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
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
      {Icon ? <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> : null}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-lg border border-input bg-background py-2 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 ${Icon ? "pl-9" : "pl-3"}`}
      />
      </div>
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
