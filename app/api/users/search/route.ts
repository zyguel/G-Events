import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate the admin
        await requireUser();

        // 2. Get the search query
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q");

        const normalizedQuery = String(q || '').trim();

        const supabase = await createAdminClient();

        // 3. Search users by email/name when a query exists, otherwise return a starter list.
        const queryBuilder = supabase
            .from("User")
            .select("id, name, email")
            .limit(10);

        const finalQuery = normalizedQuery
            ? queryBuilder.or(`email.ilike.%${normalizedQuery}%,name.ilike.%${normalizedQuery}%`)
            : queryBuilder.order('name', { ascending: true });

        const { data: users, error: userErr } = await finalQuery;

        if (userErr) {
            console.error("User Search API Error:", userErr);
            return NextResponse.json({ success: false, error: userErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: users || [] });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) {
            return authError;
        }

        console.error("User Search API Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unexpected error" },
            { status: 500 }
        );
    }
}
