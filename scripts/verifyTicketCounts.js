const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const eventId = 2; // Example event ID
    
    // 1. Get direct count from Registration table (True Total)
    const { data: regRows } = await supabase
        .from('Registration')
        .select('id, ticket_id, status')
        .eq('event_id', eventId);
    
    const trueCounts = {};
    regRows.forEach(r => {
        const s = String(r.status || '').toLowerCase();
        if (s !== 'rejected' && s !== 'cancelled') {
            trueCounts[r.ticket_id] = (trueCounts[r.ticket_id] || 0) + 1;
        }
    });
    
    console.log("True Counts (from Registration table):", trueCounts);

    // 2. Hit the API endpoint (simulating the Admin Dashboard)
    // Note: Since I'm running server-side, I'll just call the lib function directly 
    // to simulate what the API does.
    // In actual app, the API would use createAdminClient now.
    
    // I will check the most recent ticket data from the database 
    // as returned by the API's internal logic.
    const { data: tickets } = await supabase.from('Ticket').select('*').eq('event_id', eventId);
    
    console.log("\nTicket Summary (Current DB State):");
    console.table(tickets.map(t => ({
        id: t.id,
        name: t.name,
        total: t.available_quantity,
        true_used: trueCounts[t.id] || 0
    })));
}

run();
