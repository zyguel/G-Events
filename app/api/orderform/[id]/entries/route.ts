import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/emailProvider';
import { generateCheckInPass } from '@/lib/checkinQr';
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl';
import { buildEventSlug } from '@/lib/slug';
import { newTicketToken } from '@/lib/ticketToken';
import { buildAndStoreTicketQrImage } from '@/lib/ticketQrStorage';
import {
    buildBreakoutEticketUrl,
    buildBreakoutTicketEmailHtml,
    buildEticketUrl,
    buildGroupCompleteUrl,
    buildGroupMemberInviteEmailHtml,
} from '@/lib/ticketEmail';
import { verifyWaitlistInviteToken } from '@/lib/waitlistInviteToken';
import {
    buildTicketQrBlock,
    ensureQrBlockInBody,
    loadOrderConfirmationSettings,
    renderOrderConfirmationTemplate,
    wrapEmailBody,
} from '@/lib/orderConfirmationSettings';

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

type TicketAvailabilityRow = {
    id: number;
    name: string;
    price: number | null;
    free_ticket_approval_mode: string | null;
    available_quantity: number | null;
    waitlist_reserved_quantity: number | null;
};

type RegistrationUsageRow = {
    ticket_id: number | null;
    status: string | null;
};

type RegistrationDuplicateRow = {
    user_id: number;
    status: string | null;
};

type PromotionTicketLink = {
    ticket_id: number;
};

function isValidSubmittedFormData(value: unknown): value is SubmittedFormData {
    if (!value || typeof value !== 'object') return false;
    const maybe = value as SubmittedFormData;
    if (!Array.isArray(maybe.sections)) return false;
    return maybe.sections.every((section) => Array.isArray(section?.inputs));
}

const toSafeNonNegativeInt = (value: unknown): number => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n));
};

async function adjustTicketReservation(
    supabase: SupabaseClient,
    ticketId: number,
    delta: { reserved: number; available: number }
): Promise<{ success: boolean; error?: string }> {
    const { data: ticketRow, error: ticketError } = await supabase
        .from('Ticket')
        .select('id, available_quantity, waitlist_reserved_quantity')
        .eq('id', ticketId)
        .single();

    if (ticketError || !ticketRow) {
        return { success: false, error: ticketError?.message || 'Ticket not found' };
    }

    const nextReserved = Math.max(
        0,
        toSafeNonNegativeInt(ticketRow.waitlist_reserved_quantity) + delta.reserved
    );
    const nextAvailable = Math.max(
        0,
        toSafeNonNegativeInt(ticketRow.available_quantity) + delta.available
    );

    const { error: updateError } = await supabase
        .from('Ticket')
        .update({
            waitlist_reserved_quantity: nextReserved,
            available_quantity: nextAvailable,
        })
        .eq('id', ticketId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true };
}

async function countActiveRegistrationsForUser(
    supabase: SupabaseClient,
    eventId: number,
    userId: number
): Promise<{ count: number; error: string | null }> {
    const { count, error } = await supabase
        .from('Registration')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .not('status', 'in', '(cancelled,rejected)');

    if (error) {
        return { count: 0, error: error.message };
    }

    return { count: count ?? 0, error: null };
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
        const { eventId, formData, userEmail, registrationId, ticketId, groupEmails, breakoutSessionId, promotionCode, waitlistInviteToken } = body;

        const numericFormId = parseInt(id, 10);
        const numericEventId = parseInt(String(eventId), 10);
        const numericRegistrationId = registrationId ? parseInt(String(registrationId), 10) : null;
        const numericTicketId = ticketId ? parseInt(String(ticketId), 10) : null;
        const numericBreakoutSessionId =
            breakoutSessionId === null || breakoutSessionId === undefined || breakoutSessionId === ''
                ? null
                : parseInt(String(breakoutSessionId), 10);

        if (numericBreakoutSessionId !== null && Number.isNaN(numericBreakoutSessionId)) {
            return NextResponse.json({ error: 'Invalid breakoutSessionId' }, { status: 400 });
        }

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
        const sessionClient = await createClient();
        const {
            data: { user: authUser },
        } = await sessionClient.auth.getUser();

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
            .select('id, title, capacity, allow_waitlist, allow_breakout_sessions, event_start_at, event_end_at')
            .eq('id', numericEventId)
            .single();

        if (eventError || !eventRow) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const { data: ticketRows, error: ticketError } = await supabase
            .from('Ticket')
            .select('id, name, price, free_ticket_approval_mode, available_quantity, waitlist_reserved_quantity')
            .eq('event_id', numericEventId);

        if (ticketError) {
            return NextResponse.json({ error: ticketError.message }, { status: 500 });
        }

        const tickets = (ticketRows || []) as TicketAvailabilityRow[];
        const ticketIds = tickets.map((t) => t.id);
        const usageByTicket = new Map<number, number>();

        if (ticketIds.length > 0) {
            const { data: regUsageRows } = await supabase
                .from('Registration')
                .select('ticket_id, status')
                .eq('event_id', numericEventId)
                .in('ticket_id', ticketIds);

            for (const row of ((regUsageRows || []) as RegistrationUsageRow[])) {
                const status = String(row.status || '').toLowerCase();
                if (status === 'rejected' || status === 'cancelled') continue;
                const tid = Number(row.ticket_id);
                if (!Number.isNaN(tid)) {
                    usageByTicket.set(tid, (usageByTicket.get(tid) || 0) + 1);
                }
            }
        }

        console.log('[Registration] API Request Body - eventId:', eventId, 'ticketId:', ticketId, 'registrationId:', registrationId);
        console.log('[Registration] API Request Body - userEmail:', userEmail, 'groupEmails:', groupEmails);
        
        const normalizedPrimaryEmail = resolvedEmail.trim().toLowerCase();

        let waitlistInviteEntry: {
            id: number;
            email: string;
            ticket_id: number | null;
            invite_expires_at: string | null;
        } | null = null;

        if (waitlistInviteToken && typeof waitlistInviteToken === 'string') {
            const verification = verifyWaitlistInviteToken(waitlistInviteToken);
            if (!verification.valid || !verification.claims) {
                return NextResponse.json({ error: verification.reason || 'Invalid waitlist invite link' }, { status: 400 });
            }

            const claims = verification.claims;
            if (claims.eid !== numericEventId) {
                return NextResponse.json({ error: 'Waitlist invite link is for a different event' }, { status: 400 });
            }

            if (claims.email !== normalizedPrimaryEmail) {
                return NextResponse.json({ error: 'This invite link belongs to a different email address' }, { status: 403 });
            }

            const { data: inviteRow, error: inviteError } = await supabase
                .from('WaitlistEntry')
                .select('id, email, ticket_id, status, invite_expires_at')
                .eq('id', claims.wid)
                .eq('event_id', numericEventId)
                .single();

            if (inviteError || !inviteRow) {
                return NextResponse.json({ error: 'Waitlist invite entry not found' }, { status: 404 });
            }

            if (String(inviteRow.email || '').trim().toLowerCase() !== normalizedPrimaryEmail) {
                return NextResponse.json({ error: 'Waitlist invite email mismatch' }, { status: 403 });
            }

            if (String(inviteRow.status || '').toLowerCase() !== 'invited') {
                return NextResponse.json({ error: 'Waitlist invite is no longer active' }, { status: 409 });
            }

            if (inviteRow.invite_expires_at && new Date(inviteRow.invite_expires_at).getTime() < Date.now()) {
                if (inviteRow.ticket_id !== null) {
                    await adjustTicketReservation(supabase, Number(inviteRow.ticket_id), {
                        reserved: -1,
                        available: -1,
                    });
                }

                await supabase
                    .from('WaitlistEntry')
                    .update({
                        status: 'pending',
                        invite_sent_at: null,
                        invite_expires_at: null,
                    })
                    .eq('id', inviteRow.id)
                    .eq('event_id', numericEventId);

                return NextResponse.json({ error: 'Waitlist invite link has expired' }, { status: 410 });
            }

            if (claims.tid !== null && inviteRow.ticket_id !== null && Number(claims.tid) !== Number(inviteRow.ticket_id)) {
                return NextResponse.json({ error: 'Waitlist invite ticket mismatch' }, { status: 400 });
            }

            waitlistInviteEntry = {
                id: Number(inviteRow.id),
                email: String(inviteRow.email),
                ticket_id: inviteRow.ticket_id === null ? null : Number(inviteRow.ticket_id),
                invite_expires_at: inviteRow.invite_expires_at,
            };
        }

        const groupEmailsList: string[] = Array.isArray(groupEmails)
            ? groupEmails.map((e: string) => e?.trim().toLowerCase()).filter(Boolean)
            : [];

        if (groupEmailsList.some((e) => e === normalizedPrimaryEmail)) {
            return NextResponse.json(
                { error: 'Group member emails cannot include the primary registrant email.' },
                { status: 400 }
            );
        }

        if (waitlistInviteEntry && groupEmailsList.length > 0) {
            return NextResponse.json({ error: 'Waitlist invite registrations must be individual only' }, { status: 400 });
        }

        const uniqueEmails = Array.from(
            new Set([normalizedPrimaryEmail, ...groupEmailsList])
        ).filter(Boolean);

        const totalRequested = uniqueEmails.length;
        const isGroupRegistration = totalRequested > 1;

        // Enforce event-wide capacity so group submissions cannot overbook the event.
        const eventCapacity = Number((eventRow as { capacity?: number | null }).capacity ?? 0);
        if (eventCapacity > 0) {
            const { count: activeRegistrationCount, error: activeCountError } = await supabase
                .from('Registration')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', numericEventId)
                .not('status', 'in', '(cancelled,rejected)');

            if (activeCountError) {
                console.error('[Registration] Event capacity check failed:', activeCountError);
                return NextResponse.json({ error: 'Failed to validate event capacity. Please try again.' }, { status: 500 });
            }

            const { data: reserveRows, error: reserveError } = await supabase
                .from('Ticket')
                .select('waitlist_reserved_quantity')
                .eq('event_id', numericEventId);

            if (reserveError) {
                console.error('[Registration] Waitlist reserve capacity check failed:', reserveError);
                return NextResponse.json({ error: 'Failed to validate event capacity. Please try again.' }, { status: 500 });
            }

            const reservedFromTickets = (reserveRows || []).reduce(
                (sum: number, row: { waitlist_reserved_quantity?: number | null }) =>
                    sum + Math.max(0, Number(row.waitlist_reserved_quantity ?? 0)),
                0
            );

            // When redeeming a waitlist invite, one reserved slot is being consumed by this request.
            // Keep capacity validation aligned with the temporary +1 ticket allocation used by invites.
            const redeemingInviteSeat = waitlistInviteEntry ? 1 : 0;
            const activeReservedSeats = Math.max(0, reservedFromTickets - redeemingInviteSeat);
            const effectiveCapacity = Math.max(0, eventCapacity - activeReservedSeats + redeemingInviteSeat);

            const nextTotal = Number(activeRegistrationCount || 0) + totalRequested;
            if (nextTotal > effectiveCapacity) {
                const remaining = Math.max(0, effectiveCapacity - Number(activeRegistrationCount || 0));
                return NextResponse.json(
                    {
                        error: isGroupRegistration
                            ? `Group size exceeds remaining event capacity. Only ${remaining} seat(s) are left.`
                            : 'Event capacity has been reached.',
                    },
                    { status: 409 }
                );
            }
        }

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

            const activeDuplicates = ((existingRegs || []) as RegistrationDuplicateRow[]).filter((reg) => {
                const s = String(reg.status || '').toLowerCase();
                return s !== 'cancelled' && s !== 'rejected';
            });

            if (activeDuplicates.length > 0) {
                const dupEmails = activeDuplicates.map((reg) => userMap.get(reg.user_id));
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
        const effectiveTicketId = waitlistInviteEntry?.ticket_id ?? numericTicketId;

        let selectedTicket: TicketAvailabilityRow | null = null;
        if (effectiveTicketId) {
            selectedTicket = tickets.find((t) => t.id === effectiveTicketId) || null;
            if (selectedTicket) {
                const total = Number(selectedTicket.available_quantity ?? 0);
                const reservedForWaitlist = Number(selectedTicket.waitlist_reserved_quantity ?? 0);
                const publicTotal = Math.max(0, total - Math.max(0, reservedForWaitlist));
                const used = usageByTicket.get(Number(selectedTicket.id)) || 0;
                if (
                    !waitlistInviteEntry &&
                    ((publicTotal <= 0 && total > 0) || (publicTotal > 0 && (used + totalRequested) > publicTotal))
                ) {
                    selectedTicket = null; // No space for whole group
                }
            }
        }

        if (!selectedTicket && !effectiveTicketId) {
            selectedTicket = tickets.find((t) => {
                const total = Number(t.available_quantity ?? 0);
                const reservedForWaitlist = Number(t.waitlist_reserved_quantity ?? 0);
                const publicTotal = Math.max(0, total - Math.max(0, reservedForWaitlist));
                const used = usageByTicket.get(Number(t.id)) || 0;

                if (total === 0) {
                    return true;
                }

                if (publicTotal <= 0) {
                    return false;
                }

                return (used + totalRequested) <= publicTotal;
            }) || null;
        }

        let primaryRegistrationId: number | null = null;
        const registeredAttendees: Array<{ email: string; registrationId: number; profilePending: boolean }> = [];
        let submissionMode: 'registered' | 'waitlisted' = 'registered';
        const assignedTicketName = selectedTicket?.name || 'General Admission';
        let primaryTicketToken: string | null = null;
        const secondaryInvitees: { email: string; token: string }[] = [];
        let breakoutTicketToken: string | null = null;
        let breakoutSessionTitle = '';
        let breakoutSessionLocation = '';

        let finalPricePaid = selectedTicket ? Number(selectedTicket.price ?? 0) : 0;
        let validPromotionId: number | null = null;
        const orderConfirmationSettings = await loadOrderConfirmationSettings(supabase, numericEventId);
        const approvalMode = selectedTicket
            ? Number(selectedTicket.price ?? 0) > 0
                ? 'manual'
                : String(selectedTicket.free_ticket_approval_mode || '').toLowerCase() === 'automatic'
                    ? 'automatic'
                    : 'manual'
            : 'manual';
        const registrationStatus = approvalMode === 'automatic' ? 'confirmed' : 'pending';
        const shouldSendQrImmediately = registrationStatus === 'confirmed';

        if (selectedTicket && promotionCode && typeof promotionCode === 'string') {
            const { data: promoData } = await supabase
                .from('Promotion')
                .select(`id, discount_type, discount_value, max_uses, current_uses, start_at, end_at, PromotionTicket(ticket_id)`)
                .eq('event_id', numericEventId)
                .ilike('code', promotionCode.trim())
                .single();

            if (promoData) {
                const now = new Date();
                const isValidTime = 
                    (!promoData.start_at || new Date(promoData.start_at) <= now) &&
                    (!promoData.end_at || new Date(promoData.end_at) >= now);
                
                const currentUses = Number(promoData.current_uses ?? 0);
                const maxUses = Number(promoData.max_uses ?? 0);
                const isUnderLimit = maxUses === 0 || (currentUses + totalRequested) <= maxUses;

                const allowedTicketIds = ((promoData.PromotionTicket || []) as PromotionTicketLink[]).map((pt) => pt.ticket_id);
                const isTicketAllowed = allowedTicketIds.length === 0 || allowedTicketIds.includes(selectedTicket.id);
                
                if (isValidTime && isUnderLimit && isTicketAllowed) {
                    const discountVal = Number(promoData.discount_value || 0);
                    if (promoData.discount_type === 'percentage') {
                        finalPricePaid = Math.max(0, finalPricePaid * (100 - discountVal) / 100);
                    } else {
                        finalPricePaid = Math.max(0, finalPricePaid - discountVal);
                    }
                    validPromotionId = promoData.id;
                }
            }
        }

        if (selectedTicket) {
            // ── Step 1: Validate against Supabase Auth users and ensure User rows exist ────────────
            const targetEmailSet = new Set(uniqueEmails.map((e) => String(e).trim().toLowerCase()));
            const authUserNameByEmail = new Map<string, string | null>();
            const perPage = 1000;
            let page = 1;
            let hasMore = true;

            while (hasMore && authUserNameByEmail.size < targetEmailSet.size) {
                const { data: authPage, error: authLookupError } = await supabase.auth.admin.listUsers({ page, perPage });

                if (authLookupError) {
                    console.error('[Registration] Auth user lookup failed:', authLookupError);
                    return NextResponse.json(
                        { error: 'Failed to validate registrant accounts. Please try again.' },
                        { status: 500 }
                    );
                }

                const users = authPage?.users || [];
                for (const auth of users) {
                    const email = String(auth.email || '').trim().toLowerCase();
                    if (!email || !targetEmailSet.has(email)) continue;

                    const userMeta = (auth.user_metadata || {}) as Record<string, unknown>;
                    const fullName = String(userMeta.full_name || userMeta.name || '').trim() || null;
                    authUserNameByEmail.set(email, fullName);
                }

                hasMore = users.length === perPage;
                page += 1;
            }

            const { data: existingUserRows, error: existingUserLookupError } = await supabase
                .from('User')
                .select('id, email')
                .in('email', uniqueEmails);

            if (existingUserLookupError) {
                console.error('[Registration] User table lookup failed:', existingUserLookupError);
                return NextResponse.json({ error: 'Database check failed: ' + existingUserLookupError.message }, { status: 500 });
            }

            const existingProfileEmailSet = new Set(
                (existingUserRows || []).map((row: { email: string | null }) => String(row.email || '').trim().toLowerCase()).filter(Boolean)
            );

            for (const email of uniqueEmails) {
                const normalizedEmail = String(email).trim().toLowerCase();
                if (existingProfileEmailSet.has(normalizedEmail)) continue;

                if (!authUserNameByEmail.has(normalizedEmail)) {
                    console.warn('[Registration] Rejected registration because email is not in Supabase Auth:', normalizedEmail);
                    return NextResponse.json(
                        { error: `The email ${normalizedEmail} does not have an account yet. Please sign up first.` },
                        { status: 400 }
                    );
                }

                const authEmail = authUser?.email?.trim().toLowerCase() || null;
                const isPrimaryEmail = normalizedEmail === normalizedPrimaryEmail;
                const nameFromAuth = authUserNameByEmail.get(normalizedEmail) || null;
                const fallbackName =
                    (isPrimaryEmail && resolvedName && resolvedName !== 'Attendee' ? resolvedName : null) ||
                    nameFromAuth ||
                    normalizedEmail.split('@')[0] ||
                    'Attendee';

                const canProvision = isPrimaryEmail ? authEmail === normalizedPrimaryEmail : true;
                if (!canProvision) {
                    return NextResponse.json(
                        { error: `Unable to verify account ownership for ${normalizedEmail}. Please sign in with that email.` },
                        { status: 403 }
                    );
                }

                const { error: insertUserError } = await supabase
                    .from('User')
                    .insert([{ name: fallbackName, email: normalizedEmail }]);

                if (insertUserError && insertUserError.code !== '23505') {
                    console.error('[Registration] Failed to auto-provision User row:', insertUserError);
                    return NextResponse.json(
                        { error: 'Failed to initialize attendee profiles. Please try again.' },
                        { status: 500 }
                    );
                }

                existingProfileEmailSet.add(normalizedEmail);
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

            const primaryActive = await countActiveRegistrationsForUser(supabase, numericEventId, primaryUserId);
            if (primaryActive.error) {
                console.error('[Registration] Pre-insert duplicate check failed (primary):', primaryActive.error);
                return NextResponse.json(
                    { error: 'Failed to verify registration status. Please try again.' },
                    { status: 500 }
                );
            }
            if (primaryActive.count > 0) {
                return NextResponse.json(
                    { error: 'This account already has an active registration for this event.' },
                    { status: 409 }
                );
            }

            primaryTicketToken = newTicketToken();

            const { data: pReg, error: pErr } = await supabase
                .from('Registration')
                .insert([{
                    event_id: numericEventId,
                    user_id: primaryUserId,
                    ticket_id: selectedTicket.id,
                    status: registrationStatus,
                    final_price_paid: finalPricePaid,
                    registration_group_id: registrationGroupId,
                    ticket_token: primaryTicketToken,
                    profile_pending: false,
                }])
                .select('id')
                .single();

            if (pErr) {
                console.error('[Registration] Primary insert failed:', pErr);
                return NextResponse.json({ error: 'Primary registration failed: ' + pErr.message }, { status: 500 });
            }

            primaryRegistrationId = pReg.id;
            registeredAttendees.push({ email: normalizedPrimaryEmail, registrationId: pReg.id, profilePending: false });
            console.log('[Registration] Primary reg created, id:', primaryRegistrationId);

            // ── Step 4: Insert each OTHER group member ──────────────────────
            const otherEmails = uniqueEmails.filter(e => e !== normalizedPrimaryEmail);
            console.log('[Registration] Other members to register:', otherEmails);

            for (const memberEmail of otherEmails) {
                const memberTicketToken = newTicketToken();

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

                const memberActive = await countActiveRegistrationsForUser(supabase, numericEventId, memberUserId);
                if (memberActive.error) {
                    console.error('[Registration] Pre-insert duplicate check failed (member):', memberActive.error);
                    return NextResponse.json(
                        { error: 'Failed to verify registration status. Please try again.' },
                        { status: 500 }
                    );
                }
                if (memberActive.count > 0) {
                    return NextResponse.json(
                        {
                            error: `The following email(s) are already registered for this event: ${memberEmail}`,
                            duplicateEmails: [memberEmail],
                        },
                        { status: 409 }
                    );
                }

                const { data: memberReg, error: memberErr } = await supabase
                    .from('Registration')
                    .insert([{
                        event_id: numericEventId,
                        user_id: memberUserId,
                        ticket_id: selectedTicket.id,
                        status: registrationStatus,
                        final_price_paid: finalPricePaid,
                        registration_group_id: registrationGroupId,
                        ticket_token: memberTicketToken,
                        profile_pending: true,
                    }])
                    .select('id')
                    .single();

                if (memberErr) {
                    console.error('[Registration] Member insert failed for', memberEmail, ':', memberErr);
                    return NextResponse.json({ error: 'DB Member Insert Error: ' + memberErr.message }, { status: 500 });
                }

                if (memberReg?.id) {
                    registeredAttendees.push({ email: memberEmail, registrationId: memberReg.id, profilePending: true });
                }
                secondaryInvitees.push({ email: memberEmail, token: memberTicketToken });
                console.log('[Registration] Member registered (profile pending):', memberEmail);
            }

            if (
                numericBreakoutSessionId !== null &&
                primaryRegistrationId &&
                !!(eventRow as { allow_breakout_sessions?: boolean }).allow_breakout_sessions
            ) {
                const { data: breakoutRow, error: breakoutError } = await supabase
                    .from('BreakoutSession')
                    .select('id, name, description, room_name, room_capacity')
                    .eq('id', numericBreakoutSessionId)
                    .eq('event_id', numericEventId)
                    .maybeSingle();

                if (breakoutError || !breakoutRow) {
                    return NextResponse.json({ error: 'Selected breakout room was not found.' }, { status: 400 });
                }

                let breakoutMeta: Record<string, unknown> = {};
                try {
                    breakoutMeta = breakoutRow.description ? JSON.parse(String(breakoutRow.description)) : {};
                } catch {
                    breakoutMeta = {};
                }

                const breakoutType = String((breakoutMeta as { type?: string }).type || '').toLowerCase();
                if (breakoutType && breakoutType !== 'in-person') {
                    return NextResponse.json({ error: 'Only in-person breakout sessions can be selected.' }, { status: 400 });
                }

                const breakoutStatus = String((breakoutMeta as { status?: string }).status || '').toLowerCase();
                if (breakoutStatus === 'completed' || breakoutStatus === 'cancelled') {
                    return NextResponse.json({ error: 'Selected breakout room is no longer available.' }, { status: 409 });
                }

                const breakoutCap = Number(breakoutRow.room_capacity ?? 0);
                if (breakoutCap > 0) {
                    const { count: breakoutSeats, error: seatCountError } = await supabase
                        .from('BreakoutSessionRegistration')
                        .select('id', { count: 'exact', head: true })
                        .eq('breakout_session_id', numericBreakoutSessionId);

                    if (seatCountError) {
                        return NextResponse.json({ error: seatCountError.message }, { status: 500 });
                    }

                    if ((breakoutSeats || 0) >= breakoutCap) {
                        return NextResponse.json({ error: 'Selected breakout room is full.' }, { status: 409 });
                    }
                }

                breakoutTicketToken = newTicketToken();
                const { error: breakoutInsertError } = await supabase
                    .from('BreakoutSessionRegistration')
                    .insert([
                        {
                            breakout_session_id: numericBreakoutSessionId,
                            registration_id: primaryRegistrationId,
                            ticket_token: breakoutTicketToken,
                        },
                    ]);

                if (breakoutInsertError) {
                    return NextResponse.json({ error: breakoutInsertError.message }, { status: 500 });
                }

                breakoutSessionTitle = String(breakoutRow.name || 'Breakout session');
                breakoutSessionLocation = String(breakoutRow.room_name || '');
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

        if (submissionMode === 'registered' && waitlistInviteEntry) {
            if (waitlistInviteEntry.ticket_id !== null) {
                await adjustTicketReservation(supabase, Number(waitlistInviteEntry.ticket_id), {
                    reserved: -1,
                    available: 0,
                });
            }

            await supabase
                .from('WaitlistEntry')
                .delete()
                .eq('id', waitlistInviteEntry.id)
                .eq('event_id', numericEventId);
        }

        // ── Confirmation email ──────────────────────────────────────────────
        try {
            if (submissionMode === 'waitlisted') {
                await sendEmail({
                    to: resolvedEmail,
                    subject: `Waitlist: ${eventRow.title}`,
                    html: `<p>Hi ${resolvedName}, your waitlist request for ${eventRow.title} was successful.</p>`,
                });
            } else if (submissionMode === 'registered') {
                const baseUrl = getPublicAppBaseUrl(request);
                const slug = buildEventSlug(eventRow.title, numericEventId);

                let ticketUrl = '';
                let qrImageUrl = '';
                if (shouldSendQrImmediately && primaryTicketToken) {
                    ticketUrl = buildEticketUrl(baseUrl, slug, primaryTicketToken);
                    qrImageUrl = await buildAndStoreTicketQrImage({
                        supabase,
                        ticketUrl,
                        folder: `event-${numericEventId}`,
                    });
                }

                const qrBlock =
                    shouldSendQrImmediately && qrImageUrl && ticketUrl
                        ? buildTicketQrBlock({ qrImageUrl, ticketUrl })
                        : '';

                const submissionFallback = {
                    subject: shouldSendQrImmediately
                        ? `Registration submitted (confirmed) - ${eventRow.title}`
                        : `Registration submitted - ${eventRow.title}`,
                    body: shouldSendQrImmediately
                        ? `<p>Hi ${resolvedName}, your registration for <strong>${eventRow.title}</strong> is confirmed.</p>`
                        : `<p>Hi ${resolvedName}, your registration for <strong>${eventRow.title}</strong> was received and is pending organizer review.</p>`,
                };

                const submissionTemplate = renderOrderConfirmationTemplate({
                    template: orderConfirmationSettings.submissionEmail,
                    fallback: submissionFallback,
                    context: {
                        attendeeName: resolvedName,
                        attendee_name: resolvedName,
                        eventTitle: eventRow.title,
                        event_title: eventRow.title,
                        ticketName: assignedTicketName,
                        ticket_name: assignedTicketName,
                        registrationId: primaryRegistrationId,
                        registration_id: primaryRegistrationId,
                        ticketUrl,
                        ticket_url: ticketUrl,
                        qrImageUrl,
                        qr_image_url: qrImageUrl,
                        qrBlock,
                        qr_block: qrBlock,
                    },
                });

                const submissionBody = qrBlock
                    ? ensureQrBlockInBody(submissionTemplate.body, qrBlock)
                    : submissionTemplate.body;

                await sendEmail({
                    to: resolvedEmail,
                    subject: submissionTemplate.subject,
                    html: wrapEmailBody(submissionBody),
                });

                if (shouldSendQrImmediately && breakoutTicketToken) {
                    const breakoutUrl = buildBreakoutEticketUrl(baseUrl, slug, breakoutTicketToken);
                    let breakoutQrImageUrl = '';
                    try {
                        breakoutQrImageUrl = await buildAndStoreTicketQrImage({
                            supabase,
                            ticketUrl: breakoutUrl,
                            folder: `event-${numericEventId}/breakouts`,
                        });
                    } catch (breakoutQrError) {
                        console.warn('Breakout QR image generation failed; sending link-only breakout ticket email.', breakoutQrError);
                    }

                    await sendEmail({
                        to: resolvedEmail,
                        subject: `Breakout ticket - ${breakoutSessionTitle || eventRow.title}`,
                        html: buildBreakoutTicketEmailHtml({
                            attendeeName: resolvedName,
                            eventTitle: eventRow.title,
                            sessionTitle: breakoutSessionTitle || 'Breakout session',
                            sessionLocation: breakoutSessionLocation || undefined,
                            qrImageUrl: breakoutQrImageUrl || undefined,
                            ticketUrl: breakoutUrl,
                        }),
                    });
                }

                for (const inv of secondaryInvitees) {
                    const completeUrl = buildGroupCompleteUrl(baseUrl, slug, inv.token);
                    await sendEmail({
                        to: inv.email,
                        subject: `Complete your registration - ${eventRow.title}`,
                        html: buildGroupMemberInviteEmailHtml({
                            eventTitle: eventRow.title,
                            completeUrl,
                        }),
                    });
                }
            }
        } catch (err) {
            console.warn('Email failed', err);
        }

        const checkInPasses = submissionMode === 'registered' && shouldSendQrImmediately
            ? registeredAttendees
                .filter((attendee) => !attendee.profilePending)
                .map((attendee) => ({
                email: attendee.email,
                registrationId: attendee.registrationId,
                ...generateCheckInPass({
                    eventId: numericEventId,
                    registrationId: attendee.registrationId,
                    email: attendee.email,
                    eventStartAt: eventRow.event_start_at || null,
                    eventEndAt: eventRow.event_end_at || null,
                }),
            }))
            : [];

        if (validPromotionId && submissionMode === 'registered') {
            const { data: currentPromo } = await supabase.from('Promotion').select('current_uses').eq('id', validPromotionId).single();
            if (currentPromo) {
                const newUses = Number(currentPromo.current_uses || 0) + totalRequested;
                await supabase.from('Promotion').update({ current_uses: newUses }).eq('id', validPromotionId);
            }
        }

        return NextResponse.json({
            success: true,
            data: entry,
            mode: submissionMode,
            registrationStatus: submissionMode === 'registered' ? registrationStatus : null,
            approvalMode: submissionMode === 'registered' ? approvalMode : null,
            checkInPasses,
            message:
                submissionMode === 'registered'
                    ? shouldSendQrImmediately
                        ? 'Registration successful!'
                        : 'Registration submitted and pending approval.'
                    : 'Added to waitlist.'
        }, { status: 201 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
