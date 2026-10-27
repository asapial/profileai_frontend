"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PrivacyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-violet-500" />
          Privacy & visibility
        </CardTitle>
        <CardDescription>Manage public sharing for each resume separately.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Open a document and use its sharing controls to enable or disable its public link.
          Anyone with an enabled link can view the information included in that document.
        </p>
        <p className="text-sm text-muted-foreground">
          Review contact details before sharing. Remove any email address or phone number you do not want visitors to see.
        </p>
        <Button asChild><Link href="/dashboard/documents">Manage document sharing</Link></Button>
      </CardContent>
    </Card>
  );
}
