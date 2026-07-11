import { AdminFeatureFlagsClient } from "./_views/AdminFeatureFlagsClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Feature flags · Admin",
};

export default function AdminFeatureFlagsPage() {
  return <AdminFeatureFlagsClient />;
}
