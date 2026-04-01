const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data, error } = await supabase.rpc('get_fk_info', { t_name: 'Registration' });
    if (error) {
        // If RPC doesn't exist, try a raw query via a temporary function if possible, 
        // but here I'll try to just guess by looking at table list again
        console.error("RPC failed, trying to list tables instead...");
        const { data: tables } = await supabase.from('Registration').select('registration_group_id').limit(1);
        console.log("Registration row sample:", tables);
    } else {
        console.log("FK Info:", JSON.stringify(data, null, 2));
    }
    
    // Alternative: Try to see if there is a RegistrationGroup table by just trying to select from it
    const { data: groupCheck, error: groupErr } = await supabase.from('RegistrationGroup').select('*').limit(1);
    if (!groupErr) {
        console.log("RegistrationGroup table EXISTS!");
    } else {
        console.log("RegistrationGroup table does NOT exist or error:", groupErr.message);
    }
}

run();
