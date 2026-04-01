const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    // Try to describe the table via raw query if we have permissions, 
    // or just assume event_id is needed if it doesn't fail.
    // Actually, I'll try to just insert a test group and see what error it gives if columns are missing.
    try {
        const { data, error } = await supabase.from('RegistrationGroup').insert([{ event_id: 2 }]).select();
        if (error) {
            console.log("Error inserting:", error.message);
        } else {
            console.log("Success! Columns are:", Object.keys(data[0]));
            // clean up
            await supabase.from('RegistrationGroup').delete().eq('id', data[0].id);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
