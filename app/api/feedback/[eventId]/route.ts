import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── GET /api/feedback/[eventId] ────────────────────────────────────────────
// Admin: fetch aggregate feedback analytics for an event.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;

        const eventNum = parseInt(eventId, 10);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();

        // 1. Get the FeedbackForm for this event
        const { data: form, error: formError } = await supabase
            .from('FeedbackForm')
            .select('id, title, description, is_active')
            .eq('event_id', eventNum)
            .maybeSingle();

        if (formError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching feedback form:', formError);
            }
            return NextResponse.json(
                { success: false, error: 'Failed to fetch feedback form' },
                { status: 500 }
            );
        }

        if (!form) {
            return NextResponse.json({
                success: true,
                data: {
                    form: null,
                    totalSubmissions: 0,
                    avgRating: 0,
                    ratingDistribution: [1, 2, 3, 4, 5].map((s) => ({ star: s, count: 0 })),
                    comments: [],
                },
            });
        }

        // 2. Fetch FeedbackSubmission rows for this form (new-style submissions)
        const { data: submissions, error: submissionsError } = await supabase
            .from('FeedbackSubmission')
            .select('id, submitter_name, submitter_email, submitted_at')
            .eq('feedback_form_id', form.id)
            .order('submitted_at', { ascending: false });

        if (submissionsError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Failed to fetch feedback submissions:', submissionsError);
            }
            return NextResponse.json(
                { success: false, error: 'Failed to fetch feedback submissions' },
                { status: 500 }
            );
        }

        const submissionRows = submissions || [];

        // 3. Fetch all FeedbackAnswer rows for this form
        const { data: answerRows, error: ansErr } = await supabase
            .from('FeedbackAnswer')
            .select('id, feedback_submission_id, registration_id, answer, FeedbackQuestion(input_format, question_text)')
            .eq('feedback_form_id', form.id);

        if (ansErr) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching answers:', ansErr);
            }
            return NextResponse.json(
                { success: false, error: 'Failed to fetch answers' },
                { status: 500 }
            );
        }

        const answers = (answerRows || []) as any[];

        // 4. Compute avg rating across all answers
        const ratingValues = answers
            .filter((a) => a.FeedbackQuestion?.input_format === 'rating')
            .map((a) => parseFloat(a.answer))
            .filter((v) => !isNaN(v) && v >= 1 && v <= 5);

        const avgRating =
            ratingValues.length > 0
                ? parseFloat(
                      (ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length).toFixed(1)
                  )
                : 0;

        // 5. Rating distribution (1–5)
        const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        ratingValues.forEach((r) => {
            const key = String(Math.round(r));
            if (dist[key] !== undefined) dist[key]++;
        });
        const ratingDistribution = Object.entries(dist).map(([star, count]) => ({
            star: parseInt(star, 10),
            count,
        }));

        // 6. Build comments
        // New-style: group by FeedbackSubmission (has submitter_name + timestamp)
        // Old-style: answers with registration_id but no feedback_submission_id
        const commentMap: Record<string, { user: string; rating: number; text: string; time: string }> = {};

        // New-style submissions
        submissionRows.forEach((s) => {
            commentMap[`sub_${s.id}`] = {
                user: s.submitter_name || 'Anonymous',
                rating: 0,
                text: '',
                time: formatRelativeTime(s.submitted_at),
            };
        });

        // Group old-style answers by registration_id
        answers
            .filter((a) => !a.feedback_submission_id && a.registration_id)
            .forEach((a) => {
                const key = `reg_${a.registration_id}`;
                if (!commentMap[key]) {
                    commentMap[key] = { user: 'Anonymous', rating: 0, text: '', time: 'Previous' };
                }
            });

        answers.forEach((a: any) => {
            const key = a.feedback_submission_id
                ? `sub_${a.feedback_submission_id}`
                : a.registration_id
                ? `reg_${a.registration_id}`
                : null;
            if (!key || !commentMap[key]) return;

            if (a.FeedbackQuestion?.input_format === 'rating') {
                const v = parseFloat(a.answer);
                if (!isNaN(v)) commentMap[key].rating = v;
            } else if (String(a.answer || '').trim()) {
                const question = a.FeedbackQuestion?.question_text || 'Comment';
                const answer = String(a.answer).trim();
                const entry = `${question}: ${answer}`;
                commentMap[key].text = commentMap[key].text
                    ? `${commentMap[key].text}\n${entry}`
                    : entry;
            }
        });

        const comments = Object.values(commentMap)
            .filter((c) => c.text.length > 0 || c.rating > 0)
            .slice(0, 50);

        // Total unique respondents = new submissions + old registration_id-based ones
        const oldStyleCount = new Set(
            answers.filter((a) => !a.feedback_submission_id && a.registration_id).map((a) => a.registration_id)
        ).size;
        const totalSubmissions = submissionRows.length + oldStyleCount;

        return NextResponse.json({
            success: true,
            data: {
                form,
                totalSubmissions,
                avgRating,
                ratingDistribution,
                comments,
            },
        });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching feedback analytics:', error);
        }
        return NextResponse.json(
            { success: false, error: 'Failed to fetch feedback analytics' },
            { status: 500 }
        );
    }
}

// ── POST /api/feedback/[eventId] ───────────────────────────────────────────
// Public (no auth): attendee submits their feedback.
// Body: { name?, email?, registration_id?, answers: [{question_id, answer}] }
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        const eventNum = parseInt(eventId, 10);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, email, registration_id, answers } = body as {
            name?: string;
            email?: string;
            registration_id?: number;
            answers: { question_id: number; answer: string }[];
        };

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one answer is required' },
                { status: 400 }
            );
        }

        const supabase = getServiceClient();

        // 0. Verify the event has ended (feedback only available post-event)
        const { data: eventRow, error: eventError } = await supabase
            .from('Event')
            .select('event_end_at')
            .eq('id', eventNum)
            .maybeSingle();

        if (eventError || !eventRow) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            );
        }

        const now = new Date();
        const eventEnd = eventRow.event_end_at ? new Date(eventRow.event_end_at) : null;
        if (!eventEnd || now <= eventEnd) {
            return NextResponse.json(
                { success: false, error: 'Feedback is only available after the event has ended' },
                { status: 403 }
            );
        }

        // 1. Look up active FeedbackForm for this event
        const { data: form, error: formError } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', eventNum)
            .eq('is_active', true)
            .maybeSingle();

        if (formError || !form) {
            return NextResponse.json(
                { success: false, error: 'Feedback form not found or not active for this event' },
                { status: 404 }
            );
        }

        // 1b. Validate registration_id if provided (must be checked-in attendee of this event)
        if (registration_id) {
            const { data: regRow, error: regError } = await supabase
                .from('Registration')
                .select('id, has_checked_in, status')
                .eq('id', registration_id)
                .eq('event_id', eventNum)
                .eq('has_checked_in', true)
                .not('status', 'in', '(cancelled,rejected)')
                .maybeSingle();

            if (regError) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to verify registration:', regError);
                }
                return NextResponse.json(
                    { success: false, error: 'Failed to verify registration' },
                    { status: 500 }
                );
            }

            if (!regRow) {
                return NextResponse.json(
                    { success: false, error: 'You must have attended this event to submit feedback' },
                    { status: 403 }
                );
            }

            // 1c. Check for duplicate submission
            const { data: dupCheck, error: dupError } = await supabase
                .from('FeedbackSubmission')
                .select('id')
                .eq('feedback_form_id', form.id)
                .eq('registration_id', registration_id)
                .maybeSingle();

            if (dupError) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to check for duplicate submission:', dupError);
                }
                return NextResponse.json(
                    { success: false, error: 'Failed to verify submission status' },
                    { status: 500 }
                );
            }

            if (dupCheck) {
                return NextResponse.json(
                    { success: false, error: 'You have already submitted feedback for this event' },
                    { status: 409 }
                );
            }
        }

        // 2. Validate question IDs belong to this form
        const questionIds = answers.map((a) => a.question_id);
        const { data: questions, error: questionsError } = await supabase
            .from('FeedbackQuestion')
            .select('id, is_required, input_format')
            .eq('feedback_form_id', form.id)
            .in('id', questionIds);

        if (questionsError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Failed to validate question IDs:', questionsError);
            }
            return NextResponse.json(
                { success: false, error: 'Failed to validate feedback questions' },
                { status: 500 }
            );
        }

        const validIds = new Set((questions || []).map((q: any) => q.id));
        const invalid = answers.filter((a) => !validIds.has(a.question_id));
        if (invalid.length > 0) {
            return NextResponse.json(
                { success: false, error: 'One or more question IDs are invalid for this form' },
                { status: 400 }
            );
        }

        // 3. Check required questions are answered
        const required = (questions || []).filter((q: any) => q.is_required);
        const answeredIds = new Set(
            answers.filter((a) => String(a.answer || '').trim()).map((a) => a.question_id)
        );
        const missing = required.filter((q: any) => !answeredIds.has(q.id));
        if (missing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Please answer all required questions' },
                { status: 400 }
            );
        }

        // 4. Insert FeedbackSubmission
        const { data: submission, error: subError } = await supabase
            .from('FeedbackSubmission')
            .insert({
                feedback_form_id: form.id,
                event_id: eventNum,
                registration_id: registration_id ?? null,
                submitter_name: name?.trim() || null,
                submitter_email: email?.trim().toLowerCase() || null,
            })
            .select('id')
            .single();

        if (subError || !submission) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error creating submission:', subError);
            }
            return NextResponse.json(
                { success: false, error: 'Failed to save feedback submission' },
                { status: 500 }
            );
        }

        // 5. Insert FeedbackAnswers
        const answerInserts = answers
            .filter((a) => String(a.answer || '').trim() !== '')
            .map((a) => ({
                feedback_submission_id: submission.id,
                feedback_form_id: form.id,
                feedback_question_id: a.question_id,
                answer: String(a.answer).trim(),
            }));

        if (answerInserts.length > 0) {
            const { error: ansError } = await supabase
                .from('FeedbackAnswer')
                .insert(answerInserts);

            if (ansError) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error inserting answers:', ansError);
                }
                const { error: cleanupError } = await supabase.from('FeedbackSubmission').delete().eq('id', submission.id);
                if (cleanupError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Failed to cleanup submission after answer insert error:', cleanupError);
                    }
                }
                return NextResponse.json(
                    { success: false, error: 'Failed to save feedback answers' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Thank you for your feedback!',
            submissionId: submission.id,
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error submitting feedback:', error);
        }
        return NextResponse.json(
            { success: false, error: 'Failed to submit feedback' },
            { status: 500 }
        );
    }
}

// ── Helper ─────────────────────────────────────────────────────────────────
function formatRelativeTime(isoString: string): string {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
