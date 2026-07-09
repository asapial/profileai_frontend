"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Globe,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Connection = {
  id: string;
  provider: "GITHUB" | "LINKEDIN" | "GOOGLE" | "OTHER";
  accountLabel: string;
  connectedAt: string;
};

const providerMeta: Record<
  Connection["provider"],
  { icon: React.ReactNode; label: string; tone: string }
> = {
  GITHUB: {
    icon: <Globe className="h-4 w-4" />,
    label: "GitHub",
    tone: "bg-slate-100 text-slate-700",
  },
  LINKEDIN: {
    icon: <Globe className="h-4 w-4" />,
    label: "LinkedIn",
    tone: "bg-blue-100 text-blue-700",
  },
  GOOGLE: {
    icon: <Link2 className="h-4 w-4" />,
    label: "Google",
    tone: "bg-emerald-100 text-emerald-700",
  },
  OTHER: {
    icon: <Link2 className="h-4 w-4" />,
    label: "Other",
    tone: "bg-muted text-muted-foreground",
  },
};

export function ConnectionsTab() {
  const [list, setList] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftProvider, setDraftProvider] =
    useState<Connection["provider"]>("GITHUB");
  const [draftLabel, setDraftLabel] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.get<Connection[]>("/user/connections");
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount; refresh() updates local list state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const connect = async () => {
    if (!draftLabel.trim()) {
      toast.error("Enter an account label");
      return;
    }
    try {
      await api.post<Connection>("/user/connections", {
        provider: draftProvider,
        accountLabel: draftLabel.trim(),
      });
      setDraftLabel("");
      await refresh();
      toast.success("Connected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/user/connections/${id}`);
      await refresh();
      toast.success("Disconnected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-violet-500" />
          Connected apps
        </CardTitle>
        <CardDescription>
          Link external accounts to import projects and resume history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_auto]">
          <select
            value={draftProvider}
            onChange={(e) =>
              setDraftProvider(e.target.value as Connection["provider"])
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            {(Object.keys(providerMeta) as Connection["provider"][]).map(
              (p) => (
                <option key={p} value={p}>
                  {providerMeta[p].label}
                </option>
              )
            )}
          </select>
          <input
            value={draftLabel}
            placeholder="Account label (e.g. @yourhandle)"
            onChange={(e) => setDraftLabel(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <Button onClick={connect} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No connected accounts yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((c) => {
              const meta = providerMeta[c.provider];
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.tone}`}
                    >
                      {meta.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.accountLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        <CheckCircle2 className="inline h-3 w-3 text-emerald-500" />{" "}
                        {meta.label} · connected{" "}
                        {new Date(c.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}