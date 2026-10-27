import { Button } from "@/components/ui/button";

export function ProfileLoadState({ loading, error, onRetry }: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) return <p role="status" className="p-6 text-sm text-muted-foreground">Loading your profile…</p>;
  return <div role="alert" className="space-y-3 rounded-xl border p-6">
    <p className="text-sm text-destructive">{error}</p>
    <Button variant="outline" onClick={onRetry}>Retry</Button>
  </div>;
}
