import ManageOrdersClient from "./ManageOrdersClient";

export default async function ManageOrdersPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    return <ManageOrdersClient eventId={eventId} />;
}
