
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('Event')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching event:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Event columns:', Object.keys(data[0]));
        } else {
            console.log('No events found, cannot determine columns easily.');
            // Try inserting a dummy to fail and see error? No, that's risky.
            // Let's assume if it exists it would be returned.
        }
    }
}

checkSchema();
