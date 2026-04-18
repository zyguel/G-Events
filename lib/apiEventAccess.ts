import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from "@/lib/constants";
import { getCurrentUserActiveOrganization, parseOrganizationId } from "@/lib/auth/sessionRole";

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

/**
 * Verifies the event belongs to the user's active organization (RLS-scoped read),
 * then returns a service-role client for full event-scoped data (registrations, campaigns, etc.).
 */
export async function getAdminSupabaseForEventOr404(
  eventId: number
): Promise<{ ok: true; supabase: AdminClient } | { ok: false; response: NextResponse }> {
  const cookieStore = await cookies();
  const preferredOrganizationId = parseOrganizationId(
    cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
  );
  const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);
  const organizationId = orgContext.activeOrganizationId;
  if (!organizationId) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "No active organization selected" },
        { status: 400 }
      ),
    };
  }

  const authSupabase = await createClient();
  const { data: eventRow, error } = await authSupabase
    .from("Event")
    .select("id")
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !eventRow) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Event not found" }, { status: 404 }),
    };
  }

  const supabase = await createAdminClient();
  return { ok: true, supabase };
}
