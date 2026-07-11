// A-P9 server wrapper for platform analytics.

import { AdminAnalyticsClient } from "./_views/AdminAnalyticsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · Admin" };

export default function Page() {
  return <AdminAnalyticsClient />;
}