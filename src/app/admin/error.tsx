"use client";
import { PageFeedback } from "@/components/dashboard/PageFeedback";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="p-6"><PageFeedback error onRetry={reset} /></div>; }
