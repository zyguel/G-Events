import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('id', parseInt(id))
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
        const { id } = await params;
        const body = await request.json();
        const { title, description, form_data } = body;

        const { data, error } = await supabase
            .from('OrderForm')
            .update({
                title,
                description,
                form_data,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(id))
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
        const { id } = await params;

        const { error } = await supabase
            .from('OrderForm')
            .delete()
            .eq('id', parseInt(id));

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
