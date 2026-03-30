import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkForms() {
  const { data: forms } = await supabase.from('OrderForm').select('id, event_id, title');
  console.log("Forms in DB:");
  console.table(forms);
  
  const { data: events } = await supabase.from('Event').select('id, title');
  console.log("\nEvents in DB:");
  console.table(events);
}
checkForms();
