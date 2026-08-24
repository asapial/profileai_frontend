"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailPlus } from "lucide-react";
import toast from "react-hot-toast";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setPending(true);
    try {
      const result = await api.post<{
        message: string;
        passwordSetupEmailSent: boolean;
      }>("/admin/users/invite", { name: name.trim(), email: email.trim() });
      toast.success(result.message);
      setName("");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invite failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 lg:px-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 size-4" />
          User directory
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="size-5" />
            Invite a user
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Creates the account and queues email verification and secure
            password-setup instructions. No password is exposed to the admin.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Sending invitation…" : "Send invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
