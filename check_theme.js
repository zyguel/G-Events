
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('Event')
        .select('theme')
        .limit(1);

    if (error) {
        console.error('Error fetching theme:', error);
    } else {
        console.log('Theme column exists.');
    }
}

checkSchema();
