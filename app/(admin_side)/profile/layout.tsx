import { Metadata } from 'next';
import AdminCompactShell from "@/components/admin/AdminCompactShell";

export const metadata: Metadata = {
    title: 'Profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <AdminCompactShell>{children}</AdminCompactShell>;
}
