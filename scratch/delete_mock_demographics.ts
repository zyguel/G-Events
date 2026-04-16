import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const { data: event } = await supabase.from('Event').select('id, title').eq('id', 2).single();
    console.log('Event 2:', event);

    const { data, error } = await supabase.from('OrderFormEntries').select('id, registration_id, form_data').eq('event_id', 2);
    if (error) {
        console.error('Error fetching OrderFormEntries:', error);
        return;
    }
    console.log(`Found ${data.length} OrderFormEntries for event 2.`);
    
    if (data.length > 0) {
        // delete them
        const ids = data.map(d => d.id);
        const { error: deleteError } = await supabase.from('OrderFormEntries').delete().in('id', ids);
        if (deleteError) {
            console.error('Error deleting OrderFormEntries:', deleteError);
        } else {
            console.log(`Deleted ${ids.length} mock OrderFormEntries.`);
        }
    }
}
run();
