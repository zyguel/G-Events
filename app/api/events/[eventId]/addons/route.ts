import { NextRequest, NextResponse } from 'next/server';
import { getAddOns, createAddOn } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/apiAuth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function getStorageClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    return await createClient();
}

async function uploadAddOnImage(file: File, eventId: number): Promise<string> {
    const fileName = `addons/${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const supabase = await getStorageClient();

    const { error } = await supabase.storage
        .from('events')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

    return publicUrl;
}

// GET /api/events/[eventId]/addons - List all add-ons for an event
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const addOns = await getAddOns(id);
        return NextResponse.json({ success: true, data: addOns });
    } catch (error: any) {
        console.error('Error fetching add-ons:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch add-ons' },
            { status: 500 }
        );
    }
}

// POST /api/events/[eventId]/addons - Create a new add-on (accepts FormData with optional image)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string | null;
        const has_variants = formData.get('has_variants') === 'true';
        const variantsJson = formData.get('variants') as string | null;
        const imageFile = formData.get('image') as File | null;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Add-on name is required' },
                { status: 400 }
            );
        }

        let image_path: string | undefined;
        if (imageFile && imageFile.size > 0) {
            image_path = await uploadAddOnImage(imageFile, id);
        }

        const variants = variantsJson ? JSON.parse(variantsJson) : undefined;

        const addOn = await createAddOn(
            id,
            {
                name,
                description: description ?? undefined,
                image_path,
                has_variants,
            },
            variants
        );

        return NextResponse.json({ success: true, data: addOn }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating add-on:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create add-on' },
            { status: 500 }
        );
    }
}
