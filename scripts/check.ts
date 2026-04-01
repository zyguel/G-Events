import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log("Checking last 10 registrations...");
  const { data, error } = await supabase
    .from("Registration")
    .select(`
      id, 
      event_id, 
      user_id, 
      status, 
      registration_group_id,
      User (
        email,
        name
      )
    `)
    .order("id", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", error);
  } else {
    console.table(data?.map(r => ({
      id: r.id,
      event: r.event_id,
      email: (r as any).User?.email,
      name: (r as any).User?.name,
      status: r.status,
      group_id: r.registration_group_id
    })));
  }
}

check();
