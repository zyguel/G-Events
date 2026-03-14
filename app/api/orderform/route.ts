import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/orderform?eventId=1
 * List all forms for an event
 */
export async function GET(request: NextRequest) {
    try {
        const eventId = request.nextUrl.searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { error: 'eventId is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('event_id', parseInt(eventId))
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error('Error fetching forms:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orderform
 * Create a new form
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, title, description, form_data } = body;

        if (!eventId || !title) {
            return NextResponse.json(
                { error: 'eventId and title are required' },
                { status: 400 }
            );
        }

        // Enforce a single OrderForm per event:
        // if a form already exists for this event, update it instead of creating a new one
        const supabase = await createClient();

        const { data: existingForms, error: existingError } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('event_id', parseInt(eventId))
            .limit(1);

        if (existingError) {
            console.error('Supabase Error (checking existing form):', existingError);
            return NextResponse.json(
                { error: existingError.message },
                { status: 500 }
            );
        }

        if (existingForms && existingForms.length > 0) {
            const existing = existingForms[0];

            const { data, error } = await supabase
                .from('OrderForm')
                .update({
                    title,
                    description: description || '',
                    form_data: form_data || { sections: [] },
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('Supabase Error (updating existing form):', error);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                { success: true, data, formId: data.id },
                { status: 200 }
            );
        }

        const { data, error } = await supabase
            .from('OrderForm')
            .insert([
                {
                    event_id: parseInt(eventId),
                    title,
                    description: description || '',
                    form_data: form_data || { sections: [] }
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, data, formId: data.id },
            { status: 201 }
        );
    } catch (e) {
        console.error('Error creating form:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
