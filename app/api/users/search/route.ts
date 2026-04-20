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

        if (!q || q.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const supabase = await createAdminClient();

        // 3. Search for users by email or name
        // We use or with ILIKE for partial and case-insensitive matching
        const { data: users, error: userErr } = await supabase
            .from("User")
            .select("id, name, email")
            .or(`email.ilike.%${q}%,name.ilike.%${q}%`)
            .limit(10);

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
