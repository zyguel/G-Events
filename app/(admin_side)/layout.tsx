import AdminCompactShell from "@/components/admin/AdminCompactShell";

export default function AdminSideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminCompactShell>{children}</AdminCompactShell>;
}
