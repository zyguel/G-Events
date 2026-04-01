import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
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
 * Submit a form entry — supports both Individual and Group registrations.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { eventId, formData, userEmail, registrationId, ticketId, groupEmails } = body;

        const numericFormId = parseInt(id, 10);
        const numericEventId = parseInt(String(eventId), 10);
        const numericRegistrationId = registrationId ? parseInt(String(registrationId), 10) : null;
        const numericTicketId = ticketId ? parseInt(String(ticketId), 10) : null;

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

        const supabase = await createAdminClient();

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

        const submittedSections = formData.sections ?? [];
        const submittedInputs = submittedSections.flatMap((s: FormSection) => s.inputs || []);

        const missingRequired = Array.from(requiredInputIds).filter((inputId) => {
            const submitted = submittedInputs.find((input: FormInput) => input.id === inputId);
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

        // Identity Extraction
        const getAnswer = (identifier: string): string | null => {
            const hit = submittedInputs.find((input: FormInput) => input.fieldIdentifier === identifier);
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

        // Load event + ticket context
        const { data: eventRow, error: eventError } = await supabase
            .from('Event')
            .select('id, title, allow_waitlist')
            .eq('id', numericEventId)
            .single();

        if (eventError || !eventRow) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const { data: ticketRows, error: ticketError } = await supabase
            .from('Ticket')
            .select('id, name, price, available_quantity')
            .eq('event_id', numericEventId);

        if (ticketError) {
            return NextResponse.json({ error: ticketError.message }, { status: 500 });
        }

        const tickets = ticketRows || [];
        const ticketIds = tickets.map((t: any) => t.id);
        let usageByTicket = new Map<number, number>();

        if (ticketIds.length > 0) {
            const { data: regUsageRows } = await supabase
                .from('Registration')
                .select('ticket_id, status')
                .eq('event_id', numericEventId)
                .in('ticket_id', ticketIds);

            for (const row of regUsageRows || []) {
                const status = String((row as any).status || '').toLowerCase();
                if (status === 'rejected' || status === 'cancelled') continue;
                const tid = Number((row as any).ticket_id);
                if (!Number.isNaN(tid)) {
                    usageByTicket.set(tid, (usageByTicket.get(tid) || 0) + 1);
                }
            }
        }

        console.log('[Registration] API Request Body - eventId:', eventId, 'ticketId:', ticketId, 'registrationId:', registrationId);
        console.log('[Registration] API Request Body - userEmail:', userEmail, 'groupEmails:', groupEmails);
        
        const normalizedPrimaryEmail = resolvedEmail.trim().toLowerCase();
        const groupEmailsList: string[] = Array.isArray(groupEmails)
            ? groupEmails.map((e: string) => e?.trim().toLowerCase()).filter(Boolean)
            : [];

        const uniqueEmails = Array.from(
            new Set([normalizedPrimaryEmail, ...groupEmailsList])
        ).filter(Boolean);

        const totalRequested = uniqueEmails.length;
        const isGroupRegistration = totalRequested > 1;

        console.log('[Registration] Normalized Primary:', normalizedPrimaryEmail);
        console.log('[Registration] Group Emails List (Cleaned):', groupEmailsList);
        console.log('[Registration] Final Unique Emails to Register:', uniqueEmails);
        console.log('[Registration] isGroup:', isGroupRegistration, '| count:', totalRequested);

        // ── Check for Duplicate Registrations ───────────────────────────────
        // We look for existing active (not cancelled/rejected) registrations for these emails in this event.
        const { data: userRows, error: userLookupError } = await supabase
            .from('User')
            .select('id, email')
            .in('email', uniqueEmails);

        if (userLookupError) {
            console.error('[Registration] User lookup failed:', userLookupError);
            return NextResponse.json({ error: 'Database check failed: ' + userLookupError.message }, { status: 500 });
        }

        const userMap = new Map((userRows || []).map(u => [u.id, u.email]));
        const userIds = Array.from(userMap.keys());

        if (userIds.length > 0) {
            const { data: existingRegs, error: dupError } = await supabase
                .from('Registration')
                .select('user_id, status')
                .eq('event_id', numericEventId)
                .in('user_id', userIds);

            if (dupError) {
                console.error('[Registration] Duplicate check failed:', dupError);
                return NextResponse.json({ error: 'Database check failed: ' + dupError.message }, { status: 500 });
            }

            const activeDuplicates = (existingRegs || []).filter((reg: any) => {
                const s = String(reg.status || '').toLowerCase();
                return s !== 'cancelled' && s !== 'rejected';
            });

            if (activeDuplicates.length > 0) {
                const dupEmails = activeDuplicates.map((reg: any) => userMap.get(reg.user_id));
                const uniqueDupEmails = Array.from(new Set(dupEmails)).filter(Boolean);
                if (uniqueDupEmails.length > 0) {
                    return NextResponse.json({
                        error: `The following email(s) are already registered for this event: ${uniqueDupEmails.join(', ')}`,
                        duplicateEmails: uniqueDupEmails
                    }, { status: 400 });
                }
            }
        }

        // ── Ticket selection ────────────────────────────────────────────────
        let selectedTicket = null;
        if (numericTicketId) {
            selectedTicket = tickets.find((t: any) => t.id === numericTicketId) || null;
            if (selectedTicket) {
                const total = Number(selectedTicket.available_quantity ?? 0);
                const used = usageByTicket.get(Number(selectedTicket.id)) || 0;
                if (total > 0 && (used + totalRequested) > total) {
                    selectedTicket = null; // No space for whole group
                }
            }
        }

        if (!selectedTicket && !numericTicketId) {
            selectedTicket = tickets.find((t: any) => {
                const total = Number(t.available_quantity ?? 0);
                const used = usageByTicket.get(Number(t.id)) || 0;
                return total === 0 || (used + totalRequested) <= total;
            }) || null;
        }

        let primaryRegistrationId: number | null = null;
        let submissionMode: 'registered' | 'waitlisted' = 'registered';
        let assignedTicketName = selectedTicket?.name || 'General Admission';

        if (selectedTicket) {
            // ── Step 1: Verify ALL emails exist in the User table ────────────
            for (const email of uniqueEmails) {
                const { data: userCheck } = await supabase
                    .from('User')
                    .select('id')
                    .ilike('email', email)
                    .limit(1);

                if (!userCheck || userCheck.length === 0) {
                    return NextResponse.json(
                        { error: `The email ${email} is not registered in our system. All registrants must have an account.` },
                        { status: 400 }
                    );
                }
            }

            let registrationGroupId: number | null = null;
            if (isGroupRegistration) {
                const { data: groupData, error: groupErr } = await supabase
                    .from('RegistrationGroup')
                    .insert([{ 
                        event_id: numericEventId,
                        ticket_id: selectedTicket.id
                    }])
                    .select('id')
                    .single();
                
                if (groupErr) {
                    console.error('[Registration] Group creation failed:', groupErr);
                    return NextResponse.json({ error: 'Failed to initialize group: ' + groupErr.message }, { status: 500 });
                }
                registrationGroupId = groupData.id;
                console.log('[Registration] Created RegistrationGroup, id:', registrationGroupId);
            }

            // ── Step 2: Insert PRIMARY registrant first ─────────────────────
            const { data: pUserRows } = await supabase
                .from('User')
                .select('id')
                .ilike('email', normalizedPrimaryEmail)
                .limit(1);

            const primaryUserId = pUserRows![0].id;

            const { data: pReg, error: pErr } = await supabase
                .from('Registration')
                .insert([{
                    event_id: numericEventId,
                    user_id: primaryUserId,
                    ticket_id: selectedTicket.id,
                    status: 'pending',
                    final_price_paid: Number(selectedTicket.price ?? 0),
                    registration_group_id: registrationGroupId
                }])
                .select('id')
                .single();

            if (pErr) {
                console.error('[Registration] Primary insert failed:', pErr);
                return NextResponse.json({ error: 'Primary registration failed: ' + pErr.message }, { status: 500 });
            }

            primaryRegistrationId = pReg.id;
            console.log('[Registration] Primary reg created, id:', primaryRegistrationId);

            // ── Step 4: Insert each OTHER group member ──────────────────────
            const otherEmails = uniqueEmails.filter(e => e !== normalizedPrimaryEmail);
            console.log('[Registration] Other members to register:', otherEmails);

            for (const memberEmail of otherEmails) {
                // Look up the User row for this member
                const { data: memberUserRows } = await supabase
                    .from('User')
                    .select('id')
                    .ilike('email', memberEmail)
                    .limit(1);

                if (!memberUserRows || memberUserRows.length === 0) {
                    console.warn('[Registration] Skipping unknown member:', memberEmail);
                    continue;
                }

                const memberUserId = memberUserRows[0].id;

                const { error: memberErr } = await supabase
                    .from('Registration')
                    .insert([{
                        event_id: numericEventId,
                        user_id: memberUserId,
                        ticket_id: selectedTicket.id,
                        status: 'pending',
                        final_price_paid: Number(selectedTicket.price ?? 0),
                        registration_group_id: registrationGroupId,
                    }]);

                if (memberErr) {
                    console.error('[Registration] Member insert failed for', memberEmail, ':', memberErr);
                    return NextResponse.json({ error: 'DB Member Insert Error: ' + memberErr.message }, { status: 500 });
                } else {
                    console.log('[Registration] Member registered:', memberEmail);
                }
            }

        } else if (eventRow.allow_waitlist) {
            submissionMode = 'waitlisted';
            await supabase.from('WaitlistEntry').insert([{
                event_id: numericEventId,
                email: resolvedEmail,
                status: 'pending',
                ticket_id: numericTicketId || (tickets[0]?.id || null)
            }]);
        } else {
            return NextResponse.json({ error: 'Event is full' }, { status: 409 });
        }

        // ── Save OrderFormEntry ──────────────────────────────────────────────
        const { data: entry, error: eErr } = await supabase
            .from('OrderFormEntries')
            .insert([{
                event_id: numericEventId,
                order_form_id: numericFormId,
                form_data: formData,
                user_email: resolvedEmail,
                registration_id: primaryRegistrationId ?? numericRegistrationId
            }])
            .select()
            .single();

        if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

        // ── Confirmation email ──────────────────────────────────────────────
        try {
            await sendEmail({
                to: resolvedEmail,
                subject: submissionMode === 'registered'
                    ? `Your ticket for ${eventRow.title}`
                    : `Waitlist: ${eventRow.title}`,
                html: `<p>Hi ${resolvedName}, your ${submissionMode} request for ${eventRow.title} was successful.</p>`
            });
        } catch (err) {
            console.warn('Email failed', err);
        }

        return NextResponse.json({
            success: true,
            data: entry,
            mode: submissionMode,
            message: submissionMode === 'registered' ? 'Registration successful!' : 'Added to waitlist.'
        }, { status: 201 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
