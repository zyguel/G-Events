const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
    console.log('--- START BUCKET LIST ---');

    // Try to create bucket if missing
    const { data: createData, error: createError } = await supabase.storage.createBucket('events', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    if (createError) {
        console.log('Attempt to create bucket failed (expected if not admin):', createError.message);
    } else {
        console.log('Successfully created events bucket!');
    }

    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', JSON.stringify(data, null, 2));
    }
    console.log('--- END BUCKET LIST ---');
}

listBuckets();
