import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('event_id', parseInt(eventId))
            .order('created_at', { ascending: false });

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
