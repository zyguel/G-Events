import type { Metadata } from "next";
import CertificateView from "./CertificateView";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Your certificate | G Events",
    robots: { index: false, follow: false },
    description: `Certificate access (${token.slice(0, 8)}…)`,
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { token } = await params;
  if (!token) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-gray-500">
        Invalid link
      </div>
    );
  }
  return <CertificateView token={token} />;
}
