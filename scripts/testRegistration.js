const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use Admin client for setup, but hit the public API endpoint
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    // 1. Get a valid form
    const { data: forms } = await supabase.from('OrderForm').select('*').limit(1);
    const form = forms[0];
    
    // 2. Get two valid users
    const { data: users } = await supabase.from('User').select('*').limit(10);
    const primaryUser = users.find(u => u.email === 'emanuelray23@gmail.com') || users[0];
    const memberUser = users.find(u => u.email !== primaryUser.email) || users[1];

    console.log(`Registering: ${primaryUser.email} (primary) + ${memberUser.email} (member)`);

    // 3. Build payload as the frontend would
    const answers = {};
    const formData = form.form_data;
    if (formData && formData.sections) {
        for (const s of formData.sections) {
            for (const input of s.inputs) {
                if (input.required) {
                    if (input.type === 'email') answers[input.id] = primaryUser.email;
                    else answers[input.id] = 'Test Value';
                }
            }
        }
    }

    // Enrich form data with answers just like useOrderFormSubmit.ts
    const enrichedFormData = {
        sections: formData.sections.map(section => ({
            ...section,
            inputs: section.inputs.map(input => ({
                ...input,
                answer: answers[input.id] || null
            }))
        }))
    };

    const payload = {
        eventId: form.event_id,
        formData: enrichedFormData,
        userEmail: primaryUser.email,
        groupEmails: [memberUser.email], // 1 extra member
        ticketId: null // default ticket
    };

    try {
        const url = `http://localhost:3000/api/orderform/${form.id}/entries`;
        console.log(`POSTing to ${url}`);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        console.log("Status:", res.status);
        const json = await res.json();
        console.log("Response:", JSON.stringify(json, null, 2));

        if (res.ok) {
           console.log("SUCCESS! Checking database for new registrations...");
           const { data: regs } = await supabase
             .from('Registration')
             .select('id, user_id, registration_group_id')
             .eq('event_id', form.event_id)
             .order('id', { ascending: false })
             .limit(5);
           console.table(regs);
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }
}

run();
