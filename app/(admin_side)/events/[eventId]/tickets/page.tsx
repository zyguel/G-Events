import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import TicketsPageClient from "./TicketsPageClient";

export default async function TicketsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const data = await getEventData(eventId);

  if (!data) {
    return notFound();
  }

  const event = {
    id: data.id,
    name: data.name,
    date: data.date,
    status: data.status,
  };

  return <TicketsPageClient event={event} />;
}
