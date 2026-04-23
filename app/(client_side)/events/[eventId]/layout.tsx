import { getPublishedEventById } from "@/lib/actions/events";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
    const { eventId: slug } = await params;
    const idPart = slug.split("-").pop() ?? "";
    const numericId = parseInt(idPart, 10);
    if (isNaN(numericId)) return { title: "Event" };

    const data = await getPublishedEventById(numericId);
    if (!data) return { title: "Event Not Found" };

    return {
        title: {
            template: `%s | ${data.title}`,
            default: data.title,
        }
    };
}

export default function ClientEventLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
