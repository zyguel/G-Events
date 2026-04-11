import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── GET /api/feedback/form/[eventId] ───────────────────────────────────────
// Public: load the active FeedbackForm + sorted questions for a given event.
// Used by the client-side feedback page to render the form.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        const eventNum = parseInt(eventId);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();

        const { data: form, error: formError } = await supabase
            .from('FeedbackForm')
            .select(`
                id,
                event_id,
                title,
                description,
                is_active,
                created_at,
                FeedbackQuestion (
                    id,
                    question_text,
                    input_format,
                    options,
                    is_required,
                    display_order,
                    order
                )
            `)
            .eq('event_id', eventNum)
            .eq('is_active', true)
            .maybeSingle();

        if (formError) {
            console.error('Error fetching feedback form:', formError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch feedback form' },
                { status: 500 }
            );
        }

        if (!form) {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No active feedback form for this event',
            });
        }

        // Sort questions by display_order, falling back to the original "order" column
        const sortedForm = {
            ...form,
            FeedbackQuestion: [...((form as any).FeedbackQuestion || [])].sort(
                (a: any, b: any) =>
                    (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0)
            ),
        };

        return NextResponse.json({ success: true, data: sortedForm });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error fetching feedback form:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch feedback form' },
            { status: 500 }
        );
    }
}

// ── POST /api/feedback/form/[eventId] ──────────────────────────────────────
// Admin: create or replace the FeedbackForm & questions for an event.
// Body: { title?, description?, questions: [{question_text, input_format, options?, is_required?, display_order?}] }
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;

        const eventNum = parseInt(eventId);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { title, description, questions } = body as {
            title?: string;
            description?: string;
            questions: {
                question_text: string;
                input_format: 'rating' | 'text' | 'multiple_choice' | 'checkbox';
                options?: string[];
                is_required?: boolean;
                display_order?: number;
            }[];
        };

        if (!questions || questions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one question is required' },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();

        // Check if a form already exists for this event
        const { data: existing } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', eventNum)
            .maybeSingle();

        let formId: number;

        if (existing) {
            // Update existing form
            const { error: updateErr } = await supabase
                .from('FeedbackForm')
                .update({
                    title: title || 'Post-Event Feedback',
                    description: description || null,
                    is_active: true,
                })
                .eq('id', existing.id);

            if (updateErr) {
                console.error('Error updating feedback form:', updateErr);
                return NextResponse.json(
                    { success: false, error: 'Failed to update feedback form' },
                    { status: 500 }
                );
            }
            formId = existing.id;
        } else {
            // Insert new form
            const { data: form, error: insertErr } = await supabase
                .from('FeedbackForm')
                .insert({
                    event_id: eventNum,
                    title: title || 'Post-Event Feedback',
                    description: description || null,
                    is_active: true,
                })
                .select('id')
                .single();

            if (insertErr || !form) {
                console.error('Error creating feedback form:', insertErr);
                return NextResponse.json(
                    { success: false, error: 'Failed to create feedback form' },
                    { status: 500 }
                );
            }
            formId = form.id;
        }

        // Full replace: delete existing questions then re-insert
        await supabase.from('FeedbackQuestion').delete().eq('feedback_form_id', formId);

        const questionInserts = questions.map((q, idx) => ({
            feedback_form_id: formId,
            question_text: q.question_text,
            input_format: q.input_format,
            options: q.options ? JSON.stringify(q.options) : null, // stored as text in old schema
            is_required: q.is_required ?? false,
            display_order: q.display_order ?? idx,
            order: q.display_order ?? idx, // keep legacy column in sync
        }));

        const { error: qError } = await supabase
            .from('FeedbackQuestion')
            .insert(questionInserts);

        if (qError) {
            console.error('Error inserting questions:', qError);
            return NextResponse.json(
                { success: false, error: 'Failed to save questions' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback form saved successfully',
            formId,
        });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error creating feedback form:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create feedback form' },
            { status: 500 }
        );
    }
}

// ── DELETE /api/feedback/form/[eventId] ───────────────────────────────────
// Admin: soft-deactivate the feedback form (is_active = false)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;

        const eventNum = parseInt(eventId);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();

        const { error } = await supabase
            .from('FeedbackForm')
            .update({ is_active: false })
            .eq('event_id', eventNum);

        if (error) {
            console.error('Error deactivating feedback form:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to deactivate feedback form' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Feedback form deactivated' });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error deactivating feedback form:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to deactivate feedback form' },
            { status: 500 }
        );
    }
}
