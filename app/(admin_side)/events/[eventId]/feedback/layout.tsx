import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Feedback Form',
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
