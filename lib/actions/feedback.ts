'use server'

import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ── Helper ─────────────────────────────────────────────────────────────────

function getServiceRoleClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

function formatRelativeTime(isoString: string): string {
    const now = new Date()
    const past = new Date(isoString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface FeedbackComment {
    user: string
    rating: number
    text: string
    time: string
    eventName?: string
}

export interface RatingDistribution {
    star: number
    count: number
}

export interface FeedbackAnalytics {
    hasForm: boolean
    formTitle: string | null
    formIsActive: boolean
    totalSubmissions: number
    avgRating: number
    ratingDistribution: RatingDistribution[]
    comments: FeedbackComment[]
}

// ── getEventFeedbackAnalytics ──────────────────────────────────────────────
/**
 * Server action: fetch feedback analytics for a specific event.
 * Handles both old-style (registration_id) and new-style (feedback_submission_id) answers.
 */
export async function getEventFeedbackAnalytics(eventId: number): Promise<FeedbackAnalytics> {
    const empty: FeedbackAnalytics = {
        hasForm: false,
        formTitle: null,
        formIsActive: false,
        totalSubmissions: 0,
        avgRating: 0,
        ratingDistribution: [1, 2, 3, 4, 5].map((s) => ({ star: s, count: 0 })),
        comments: [],
    }

    try {
        const supabase = await createClient()

        // 1. Get FeedbackForm for this event
        const { data: form } = await supabase
            .from('FeedbackForm')
            .select('id, title, is_active')
            .eq('event_id', eventId)
            .maybeSingle()

        if (!form) return empty

        // 2. Get all FeedbackAnswer rows for this form
        const { data: answerRows } = await supabase
            .from('FeedbackAnswer')
            .select('id, feedback_submission_id, registration_id, answer, FeedbackQuestion(input_format)')
            .eq('feedback_form_id', form.id)

        const answers = (answerRows || []) as any[]

        // 3. Get FeedbackSubmission rows (new-style; may be empty)
        const { data: submissions } = await supabase
            .from('FeedbackSubmission')
            .select('id, submitter_name, submitted_at')
            .eq('feedback_form_id', form.id)
            .order('submitted_at', { ascending: false })
            .limit(100)

        const submissionRows = submissions || []

        // 4. Compute avg rating
        const ratingValues = answers
            .filter((a) => a.FeedbackQuestion?.input_format === 'rating')
            .map((a) => parseFloat(a.answer))
            .filter((v) => !isNaN(v) && v >= 1 && v <= 5)

        const avgRating =
            ratingValues.length > 0
                ? parseFloat(
                      (ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length).toFixed(1)
                  )
                : 0

        // 5. Rating distribution
        const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        ratingValues.forEach((r) => {
            const key = String(Math.round(r))
            if (dist[key] !== undefined) dist[key]++
        })
        const ratingDistribution = Object.entries(dist).map(([star, count]) => ({
            star: parseInt(star),
            count,
        }))

        // 6. Build comment map (new-style: by submission; old-style: by registration_id)
        const commentMap: Record<string, FeedbackComment> = {}

        submissionRows.forEach((s) => {
            commentMap[`sub_${s.id}`] = {
                user: s.submitter_name || 'Anonymous',
                rating: 0,
                text: '',
                time: formatRelativeTime(s.submitted_at),
            }
        })

        // Seed old-style entries
        answers
            .filter((a) => !a.feedback_submission_id && a.registration_id)
            .forEach((a) => {
                const key = `reg_${a.registration_id}`
                if (!commentMap[key]) {
                    commentMap[key] = { user: 'Anonymous', rating: 0, text: '', time: 'Previous' }
                }
            })

        answers.forEach((a) => {
            const key = a.feedback_submission_id
                ? `sub_${a.feedback_submission_id}`
                : a.registration_id
                ? `reg_${a.registration_id}`
                : null
            if (!key || !commentMap[key]) return

            if (a.FeedbackQuestion?.input_format === 'rating') {
                const v = parseFloat(a.answer)
                if (!isNaN(v)) commentMap[key].rating = v
            } else if (String(a.answer || '').trim()) {
                commentMap[key].text = commentMap[key].text
                    ? `${commentMap[key].text}\n${String(a.answer).trim()}`
                    : String(a.answer).trim()
            }
        })

        const comments = Object.values(commentMap)
            .filter((c) => c.text.length > 0 || c.rating > 0)
            .slice(0, 50)

        const oldStyleCount = new Set(
            answers.filter((a) => !a.feedback_submission_id && a.registration_id).map((a) => a.registration_id)
        ).size
        const totalSubmissions = submissionRows.length + oldStyleCount

        return {
            hasForm: true,
            formTitle: form.title,
            formIsActive: form.is_active ?? true,
            totalSubmissions,
            avgRating,
            ratingDistribution,
            comments,
        }
    } catch (e) {
        console.error('getEventFeedbackAnalytics error:', e)
        return empty
    }
}

// ── ensureDefaultFeedbackForm ──────────────────────────────────────────────
/**
 * Server action: create a default feedback form for an event if one doesn't
 * already exist. Returns the form id or null on failure.
 */
export async function ensureDefaultFeedbackForm(eventId: number): Promise<number | null> {
    try {
        const supabase = getServiceRoleClient()

        const { data: existing } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', eventId)
            .maybeSingle()

        if (existing) return existing.id

        const { data: form, error: formError } = await supabase
            .from('FeedbackForm')
            .insert({
                event_id: eventId,
                title: 'Post-Event Feedback',
                description: 'We value your feedback! Please share your experience.',
                is_active: true,
            })
            .select('id')
            .single()

        if (formError || !form) {
            console.error('ensureDefaultFeedbackForm: failed to create form', formError)
            return null
        }

        // Default questions using the real schema columns
        await supabase.from('FeedbackQuestion').insert([
            {
                feedback_form_id: form.id,
                question_text: 'Overall, how satisfied were you with this event?',
                input_format: 'rating',
                is_required: true,
                display_order: 0,
                order: 0,
            },
            {
                feedback_form_id: form.id,
                question_text: 'What did you enjoy most about the event?',
                input_format: 'text',
                is_required: false,
                display_order: 1,
                order: 1,
            },
            {
                feedback_form_id: form.id,
                question_text: 'What could we improve for future events?',
                input_format: 'text',
                is_required: false,
                display_order: 2,
                order: 2,
            },
        ])

        return form.id
    } catch (e) {
        console.error('ensureDefaultFeedbackForm error:', e)
        return null
    }
}
