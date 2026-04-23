import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Management',
};

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
