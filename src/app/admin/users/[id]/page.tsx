import { AdminUserDetailClient } from "@/app/admin/users/[id]/_views/AdminUserDetailClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminUserDetailClient userId={id} />;
}
