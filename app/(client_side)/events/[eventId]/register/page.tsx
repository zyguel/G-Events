import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ClientHeader from "@/components/client/ClientHeader";
import OrderFormDisplay from "@/components/public/OrderFormDisplay";
import { getEventById } from "@/lib/actions/events";
import { getOrderFormsByEvent } from "@/lib/actions/orderForm";
import { buildEventSlug } from "@/lib/slug";

export default async function PublicEventRegistrationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!eventId || eventId === "undefined") return notFound();

  const numericEventId = parseInt(eventId.split("-").pop() ?? "", 10);
  if (isNaN(numericEventId)) return notFound();

  const event = await getEventById(numericEventId);
  if (!event) return notFound();

  const formsResult = await getOrderFormsByEvent(numericEventId);
  const form = formsResult?.data?.[0];
  const eventSlug = buildEventSlug(event.title, event.id);

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100">
      <ClientHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ChevronLeft size={16} />
          Back to event
        </Link>

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Register for {event.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Complete the registration form to reserve your slot.
          </p>
        </section>

        {!form ? (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registration is not open yet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This event does not have a published registration form yet. Please
              check back later.
            </p>
          </section>
        ) : (
          <OrderFormDisplay
            formData={form.form_data || { sections: [] }}
            eventId={numericEventId}
            orderFormId={form.id}
          />
        )}
      </main>
    </div>
  );
}
