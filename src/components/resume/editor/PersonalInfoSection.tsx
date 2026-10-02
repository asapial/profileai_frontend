"use client";

import { Loader2, Mail, Phone, MapPin, User } from "lucide-react";
import type { ResumeDetail, ResumePersonalInfo } from "@/lib/hooks/useResumes";

type Props = {
  detail: ResumeDetail;
  saving: boolean;
  onChange: (patch: Partial<ResumePersonalInfo>) => void;
};

export function PersonalInfoSection({ detail, saving, onChange }: Props) {
  const info = detail.contentData.personalInfo ?? {};

  function commit(patch: Partial<ResumePersonalInfo>) {
    onChange(patch);
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-violet-500" />
          <h3 className="text-base font-semibold">Personal info</h3>
        </div>
        {saving ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" value={info.firstName ?? ""} onChange={(v) => commit({ firstName: v })} />
        <Field label="Last name" value={info.lastName ?? ""} onChange={(v) => commit({ lastName: v })} />
      </div>
      <Field label="Headline" value={info.headline ?? ""} onChange={(v) => commit({ headline: v })} placeholder="Senior Frontend Engineer" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email"
          value={info.email ?? ""}
          icon={Mail}
          onChange={(v) => commit({ email: v })}
        />
        <Field
          label="Phone"
          value={info.phone ?? ""}
          icon={Phone}
          onChange={(v) => commit({ phone: v })}
        />
      </div>
      <Field
        label="Location"
        value={info.location ?? ""}
        icon={MapPin}
        onChange={(v) => commit({ location: v })}
        placeholder="City, Country"
      />
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600 dark:text-violet-300" />
        ) : null}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
            Icon ? "pl-10" : ""
          }`}
        />
      </span>
    </label>
  );
}
