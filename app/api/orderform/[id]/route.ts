import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/orderform/[id]
 * Get a single form by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('id', numericId)
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error('Error fetching form:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/orderform/[id]
 * Update a form
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, description, form_data } = body;

        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('OrderForm')
            .update({
                title,
                description,
                form_data,
                updated_at: new Date().toISOString()
            })
            .eq('id', numericId)
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
            { success: true, data, message: 'Form updated successfully' }
        );
    } catch (e) {
        console.error('Error updating form:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/orderform/[id]
 * Delete a form
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
        }

        const { error } = await supabase
            .from('OrderForm')
            .delete()
            .eq('id', numericId);

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Form deleted successfully'
        });
    } catch (e) {
        console.error('Error deleting form:', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
