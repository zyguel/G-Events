import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/emailProvider';

type FormInput = {
    id?: string;
    question?: string;
    fieldIdentifier?: string;
    required?: boolean;
    answer?: unknown;
};

type FormSection = {
    inputs?: FormInput[];
};

type SubmittedFormData = {
    sections?: FormSection[];
};

function isValidSubmittedFormData(value: unknown): value is SubmittedFormData {
    if (!value || typeof value !== 'object') return false;
    const maybe = value as SubmittedFormData;
    if (!Array.isArray(maybe.sections)) return false;
    return maybe.sections.every((section) => Array.isArray(section?.inputs));
}

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

        const numericFormId = parseInt(id, 10);
        const numericEventId = parseInt(String(eventId), 10);
        const numericRegistrationId = registrationId ? parseInt(String(registrationId), 10) : null;

        if (isNaN(numericFormId) || isNaN(numericEventId)) {
            return NextResponse.json(
                { error: 'Valid eventId and form ID are required' },
                { status: 400 }
            );
        }

        if (!isValidSubmittedFormData(formData)) {
            return NextResponse.json(
                { error: 'Invalid formData payload' },
                { status: 400 }
            );
        }

        if (registrationId && Number.isNaN(numericRegistrationId)) {
            return NextResponse.json(
                { error: 'Invalid registrationId' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify order form belongs to the same event.
        const { data: existingForm, error: formError } = await supabase
            .from('OrderForm')
            .select('id, event_id, form_data')
            .eq('id', numericFormId)
            .single();

        if (formError || !existingForm) {
            return NextResponse.json(
                { error: 'Order form not found' },
                { status: 404 }
            );
        }

        if (existingForm.event_id !== numericEventId) {
            return NextResponse.json(
                { error: 'Order form does not belong to this event' },
                { status: 400 }
            );
        }

        const templateSections: FormSection[] = Array.isArray((existingForm.form_data as SubmittedFormData)?.sections)
            ? (existingForm.form_data as SubmittedFormData).sections!
            : [];

        const templateInputs = templateSections.flatMap((s) => s.inputs || []);
        const requiredInputIds = new Set(
            templateInputs.filter((input) => input.required && input.id).map((input) => input.id as string)
        );
        const templateInputIds = new Set(
            templateInputs.filter((input) => input.id).map((input) => input.id as string)
        );

        const submittedSections = formData.sections ?? [];
        const submittedInputs = submittedSections.flatMap((s) => s.inputs || []);
        const submittedInputIds = new Set(
            submittedInputs.filter((input) => input.id).map((input) => input.id as string)
        );

        const missingRequired = Array.from(requiredInputIds).filter((inputId) => {
            const submitted = submittedInputs.find((input) => input.id === inputId);
            if (!submitted) return true;
            if (Array.isArray(submitted.answer)) return submitted.answer.length === 0;
            return submitted.answer === undefined || submitted.answer === null || submitted.answer === '';
        });

        if (missingRequired.length > 0) {
            return NextResponse.json(
                { error: 'Missing required fields', missingFieldIds: missingRequired },
                { status: 400 }
            );
        }

        const unknownFields = Array.from(submittedInputIds).filter((inputId) => !templateInputIds.has(inputId));
        if (unknownFields.length > 0) {
            return NextResponse.json(
                { error: 'Submitted fields do not match form definition', unknownFieldIds: unknownFields },
                { status: 400 }
            );
        }

        // Pull user identity from submitted form data when not explicitly provided.
        const getAnswer = (identifier: string): string | null => {
            const hit = submittedInputs.find((input) => input.fieldIdentifier === identifier);
            if (!hit) return null;
            if (Array.isArray(hit.answer)) return hit.answer[0] ? String(hit.answer[0]) : null;
            if (hit.answer === undefined || hit.answer === null) return null;
            const value = String(hit.answer).trim();
            return value.length > 0 ? value : null;
        };

        const extractedEmail = getAnswer('email');
        const extractedFirstName = getAnswer('first_name');
        const extractedLastName = getAnswer('last_name');
        const extractedCompany = getAnswer('company');
        const resolvedEmail = (userEmail || extractedEmail || '').toString().trim().toLowerCase();
        const resolvedName = [extractedFirstName, extractedLastName].filter(Boolean).join(' ').trim() || extractedCompany || 'Attendee';

        if (!resolvedEmail) {
            return NextResponse.json(
                { error: 'A valid email is required in the form submission' },
                { status: 400 }
            );
        }

        // Load event + ticket context for auto registration/waitlist.
        const { data: eventRow, error: eventError } = await supabase
            .from('Event')
            .select('id, title, allow_waitlist')
            .eq('id', numericEventId)
            .single();

        if (eventError || !eventRow) {
            return NextResponse.json(
                { error: 'Event not found for this form submission' },
                { status: 404 }
            );
        }

        const { data: ticketRows, error: ticketError } = await supabase
            .from('Ticket')
            .select('id, name, price, available_quantity, created_at')
            .eq('event_id', numericEventId)
            .order('price', { ascending: true })
            .order('created_at', { ascending: true });

        if (ticketError) {
            return NextResponse.json(
                { error: ticketError.message },
                { status: 500 }
            );
        }

        const tickets = ticketRows || [];
        const ticketIds = tickets.map((t: any) => t.id);
        let usageByTicket = new Map<number, number>();

        if (ticketIds.length > 0) {
            const { data: regUsageRows, error: regUsageError } = await supabase
                .from('Registration')
                .select('ticket_id, status')
                .eq('event_id', numericEventId)
                .in('ticket_id', ticketIds);

            if (regUsageError) {
                return NextResponse.json(
                    { error: regUsageError.message },
                    { status: 500 }
                );
            }

            for (const row of regUsageRows || []) {
                const status = String((row as any).status || '').toLowerCase();
                if (status === 'rejected' || status === 'cancelled') continue;
                const tid = Number((row as any).ticket_id);
                if (Number.isNaN(tid)) continue;
                usageByTicket.set(tid, (usageByTicket.get(tid) || 0) + 1);
            }
        }

        const firstAvailableTicket = tickets.find((ticket: any) => {
            const total = Number(ticket.available_quantity ?? 0);
            if (!total || total <= 0) return false;
            const used = usageByTicket.get(Number(ticket.id)) || 0;
            return used < total;
        }) || null;

        // Resolve/create user row for registration linkage.
        const { data: userRows, error: userLookupError } = await supabase
            .from('User')
            .select('id')
            .ilike('email', resolvedEmail)
            .limit(1);

        if (userLookupError) {
            return NextResponse.json(
                { error: userLookupError.message },
                { status: 500 }
            );
        }

        let userId: number | null = null;
        if (userRows && userRows.length > 0) {
            userId = userRows[0].id;
        } else {
            const { data: insertedUser, error: createUserError } = await supabase
                .from('User')
                .insert([{ name: resolvedName, email: resolvedEmail }])
                .select('id')
                .single();
            if (createUserError) {
                return NextResponse.json(
                    { error: createUserError.message },
                    { status: 500 }
                );
            }
            userId = insertedUser.id;
        }

        let createdRegistrationId: number | null = null;
        let submissionMode: 'registered' | 'waitlisted' = 'registered';
        let assignedTicketName = firstAvailableTicket?.name || 'General Admission';

        if (firstAvailableTicket && userId) {
            // Prevent duplicate active registrations for the same user/event.
            const { data: existingRegs, error: dupCheckError } = await supabase
                .from('Registration')
                .select('id, status')
                .eq('event_id', numericEventId)
                .eq('user_id', userId)
                .limit(1);

            if (dupCheckError) {
                return NextResponse.json(
                    { error: dupCheckError.message },
                    { status: 500 }
                );
            }

            const hasActiveRegistration = (existingRegs || []).some((row: any) => {
                const status = String(row.status || '').toLowerCase();
                return status !== 'rejected' && status !== 'cancelled';
            });

            if (hasActiveRegistration) {
                return NextResponse.json(
                    { error: 'You already have an active registration for this event.' },
                    { status: 409 }
                );
            }

            let registrationInsertError: any = null;
            let insertedRegistration: any = null;

            // First attempt: write richer fields.
            const registrationPayloadRich = {
                event_id: numericEventId,
                user_id: userId,
                ticket_id: firstAvailableTicket.id,
                status: 'pending',
                final_price_paid: Number(firstAvailableTicket.price ?? 0),
                has_checked_in: false,
                is_waitlisted: false,
            };
            const richInsert = await supabase
                .from('Registration')
                .insert([registrationPayloadRich])
                .select('id')
                .single();

            if (richInsert.error) {
                // Fallback for stricter/older schemas.
                const registrationPayloadMinimal = {
                    event_id: numericEventId,
                    user_id: userId,
                    ticket_id: firstAvailableTicket.id,
                    status: 'pending',
                };
                const minimalInsert = await supabase
                    .from('Registration')
                    .insert([registrationPayloadMinimal])
                    .select('id')
                    .single();
                registrationInsertError = minimalInsert.error;
                insertedRegistration = minimalInsert.data;
            } else {
                registrationInsertError = null;
                insertedRegistration = richInsert.data;
            }

            if (registrationInsertError || !insertedRegistration) {
                return NextResponse.json(
                    { error: registrationInsertError?.message || 'Failed to create registration' },
                    { status: 500 }
                );
            }
            createdRegistrationId = insertedRegistration.id;
            submissionMode = 'registered';
        } else if (eventRow.allow_waitlist) {
            submissionMode = 'waitlisted';

            const { data: existingWaitlist, error: waitDupError } = await supabase
                .from('WaitlistEntry')
                .select('id')
                .eq('event_id', numericEventId)
                .eq('email', resolvedEmail)
                .limit(1);

            if (waitDupError) {
                return NextResponse.json(
                    { error: waitDupError.message },
                    { status: 500 }
                );
            }

            if (!existingWaitlist || existingWaitlist.length === 0) {
                const { error: waitlistInsertError } = await supabase
                    .from('WaitlistEntry')
                    .insert([
                        {
                            event_id: numericEventId,
                            email: resolvedEmail,
                            status: 'pending',
                            ticket_id: tickets[0]?.id || null,
                        },
                    ]);
                if (waitlistInsertError) {
                    return NextResponse.json(
                        { error: waitlistInsertError.message },
                        { status: 500 }
                    );
                }
            }
        } else {
            return NextResponse.json(
                { error: 'Registration is full and waitlist is disabled.' },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from('OrderFormEntries')
            .insert([
                {
                    event_id: numericEventId,
                    order_form_id: numericFormId,
                    form_data: formData,
                    user_email: resolvedEmail,
                    registration_id: createdRegistrationId ?? numericRegistrationId
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

        // Send post-submission email but do not fail submission if email provider errors.
        try {
            if (submissionMode === 'registered') {
                await sendEmail({
                    to: resolvedEmail,
                    subject: `Your ticket for ${eventRow.title}`,
                    html: `
                        <p>Hi ${resolvedName},</p>
                        <p>Your registration for <strong>${eventRow.title}</strong> is received.</p>
                        <p><strong>Ticket:</strong> ${assignedTicketName}</p>
                        <p><strong>Reference ID:</strong> ${createdRegistrationId ?? data.id}</p>
                        <p>Please keep this email for your records. Your QR/check-in details will be shared in follow-up communications.</p>
                    `,
                });
            } else {
                await sendEmail({
                    to: resolvedEmail,
                    subject: `You are on the waitlist for ${eventRow.title}`,
                    html: `
                        <p>Hi ${resolvedName},</p>
                        <p>Thanks for your interest in <strong>${eventRow.title}</strong>.</p>
                        <p>You have been added to the waitlist. We will notify you by email if a slot opens.</p>
                    `,
                });
            }
        } catch (emailError) {
            console.warn('Order form submission succeeded but email failed:', emailError);
        }

        const successMessage = submissionMode === 'registered'
            ? 'Registration received. Your ticket details were sent via email.'
            : 'Event is full. You have been added to the waitlist and notified by email.';

        return NextResponse.json(
            { success: true, data, entryId: data.id, mode: submissionMode, message: successMessage },
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
