import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ClientHeader from '@/components/client/ClientHeader';
import ClientMobileNav from '@/components/client/ClientMobileNav';
import CertificatesClient from './CertificatesClient';

export const metadata = {
    title: 'My Certificates',
};

export default async function CertificatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const userEmail = user.email;

    // Fetch certificates issued to this user's email
    const { data: certificates } = await supabase
        .from('CertificateIssue')
        .select(`
            id,
            recipient_name,
            recipient_email,
            issued_at,
            access_token,
            status,
            Event!inner(title, event_start_at),
            CertificateTemplate!inner(name)
        `)
        .eq('recipient_email', userEmail)
        .order('issued_at', { ascending: false });

    // Type cast to match the expected interface
    const typedCertificates = (certificates || []).map((cert: any) => ({
        id: cert.id,
        recipient_name: cert.recipient_name,
        recipient_email: cert.recipient_email,
        issued_at: cert.issued_at,
        access_token: cert.access_token,
        status: cert.status,
        Event: Array.isArray(cert.Event) ? cert.Event[0] : cert.Event,
        CertificateTemplate: Array.isArray(cert.CertificateTemplate) ? cert.CertificateTemplate[0] : cert.CertificateTemplate,
    }));

    return (
        <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
            <ClientHeader />
            <CertificatesClient 
                certificates={typedCertificates}
                userEmail={userEmail ?? ''}
            />
            <ClientMobileNav activePage="certificates" />
        </div>
    );
}
