import { createAdminClient } from "./lib/supabase-server";

async function checkDuplicates() {
    const supabase = await createAdminClient();
    // Count duplicates by (event_id, user_id)
    const { data, error } = await supabase
        .from('Registration')
        .select('event_id, user_id')
        .order('event_id', { ascending: true });

    if (error) {
        console.error("Error fetching registrations:", error);
        return;
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];

    (data || []).forEach((reg: any) => {
        const key = `${reg.event_id}-${reg.user_id}`;
        if (seen.has(key)) {
            duplicates.push(key);
        }
        seen.add(key);
    });

    console.log("Total registrations:", data?.length);
    console.log("Duplicate count:", duplicates.length);
    if (duplicates.length > 0) {
        console.log("First few duplicates:", duplicates.slice(0, 5));
    }
}

checkDuplicates();
