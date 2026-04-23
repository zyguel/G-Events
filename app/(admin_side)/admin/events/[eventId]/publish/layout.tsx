import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Publish Settings',
};

export default function PublishLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
