import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/orderform/[id]/entries
 * Submit a form entry
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { eventId, formData, userEmail, registrationId } = body;

        if (!eventId || !formData) {
            return NextResponse.json(
                { error: 'eventId and formData are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('OrderFormEntries')
            .insert([
                {
                    event_id: parseInt(eventId),
                    order_form_id: parseInt(id),
                    form_data: formData,
                    user_email: userEmail || null,
                    registration_id: registrationId ? parseInt(registrationId) : null
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
            { success: true, data, entryId: data.id },
            { status: 201 }
        );
    } catch (e) {
        console.error('Error saving form entry:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
