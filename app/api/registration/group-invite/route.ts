import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase-server';
import { filterFormForGroupSecondary, isPaymentRelatedField } from '@/lib/registrationPaymentFields';
import type { FormInputField, OrderFormData } from '@/lib/types';

type FormInput = {
    id?: string;
    question?: string;
    type?: string;
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

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function isSkippedPaymentTemplateField(input: FormInput): boolean {
    return isPaymentRelatedField({
        fieldIdentifier: (input.fieldIdentifier ?? 'custom') as FormInputField['fieldIdentifier'],
        type: (input.type ?? 'short_answer') as FormInputField['type'],
        question: input.question ?? '',
    });
}

function missingRequiredForFilteredTemplate(
    templateSections: FormSection[],
    submittedInputs: FormInput[],
    skipField: (input: FormInput) => boolean
): string[] {
    const templateInputs = templateSections.flatMap((s) => s.inputs || []);
    const requiredInputIds = new Set(
        templateInputs
            .filter((input) => input.required && input.id && !skipField(input))
            .map((input) => input.id as string)
    );

    return Array.from(requiredInputIds).filter((inputId) => {
        const submitted = submittedInputs.find((input: FormInput) => input.id === inputId);
        if (!submitted) return true;
        if (Array.isArray(submitted.answer)) return submitted.answer.length === 0;
        return submitted.answer === undefined || submitted.answer === null || submitted.answer === '';
    });
}

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token')?.trim();
        const eventIdRaw = request.nextUrl.searchParams.get('eventId')?.trim();
        const numericEventId = eventIdRaw ? parseInt(eventIdRaw, 10) : NaN;

        if (!token || Number.isNaN(numericEventId)) {
            return NextResponse.json({ error: 'token and eventId are required' }, { status: 400 });
        }

        const authClient = await createClient();
        const {
            data: { user },
        } = await authClient.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: 'Sign in required', needsAuth: true }, { status: 401 });
        }

        const admin = await createAdminClient();

        const { data: reg, error: regErr } = await admin
            .from('Registration')
            .select('id, user_id, event_id, profile_pending, ticket_token')
            .eq('ticket_token', token)
            .maybeSingle();

        if (regErr || !reg) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
        }

        if (!reg.profile_pending) {
            return NextResponse.json({ error: 'Profile already completed' }, { status: 409 });
        }

        if (Number(reg.event_id) !== numericEventId) {
            return NextResponse.json({ error: 'Link does not match this event' }, { status: 400 });
        }

        const { data: regUser } = await admin.from('User').select('email').eq('id', reg.user_id).maybeSingle();

        const regEmail = regUser?.email ? normalizeEmail(regUser.email) : '';
        if (!regEmail || normalizeEmail(user.email) !== regEmail) {
            return NextResponse.json(
                { error: 'Signed in as a different account than this invitation' },
                { status: 403 }
            );
        }

        const { data: forms, error: formErr } = await admin
            .from('OrderForm')
            .select('id, form_data')
            .eq('event_id', numericEventId)
            .order('id', { ascending: true })
            .limit(1);

        if (formErr || !forms?.length) {
            return NextResponse.json({ error: 'Registration form not found' }, { status: 404 });
        }

        const orderFormId = forms[0].id as number;
        const rawForm = forms[0].form_data as OrderFormData;
        const formData = filterFormForGroupSecondary(rawForm || { sections: [] });

        const { data: eventRow } = await admin.from('Event').select('title').eq('id', numericEventId).maybeSingle();

        return NextResponse.json({
            success: true,
            orderFormId,
            formData,
            eventTitle: eventRow?.title || 'Event',
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, eventId, formData } = body;
        const numericEventId = parseInt(String(eventId), 10);
        const tokenStr = typeof token === 'string' ? token.trim() : '';

        if (!tokenStr || Number.isNaN(numericEventId)) {
            return NextResponse.json({ error: 'token and eventId are required' }, { status: 400 });
        }

        if (!isValidSubmittedFormData(formData)) {
            return NextResponse.json({ error: 'Invalid formData payload' }, { status: 400 });
        }

        const authClient = await createClient();
        const {
            data: { user },
        } = await authClient.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        }

        const admin = await createAdminClient();

        const { data: existingForm, error: formLookupErr } = await admin
            .from('OrderForm')
            .select('id, event_id, form_data')
            .eq('event_id', numericEventId)
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (formLookupErr || !existingForm) {
            return NextResponse.json({ error: 'Order form not found' }, { status: 404 });
        }

        const templateSections: FormSection[] = Array.isArray(
            (existingForm.form_data as SubmittedFormData)?.sections
        )
            ? (existingForm.form_data as SubmittedFormData).sections!
            : [];

        const submittedSections = formData.sections ?? [];
        const submittedInputs = submittedSections.flatMap((s: FormSection) => s.inputs || []);

        const missingRequired = missingRequiredForFilteredTemplate(
            templateSections,
            submittedInputs,
            isSkippedPaymentTemplateField
        );

        if (missingRequired.length > 0) {
            return NextResponse.json(
                { error: 'Missing required fields', missingFieldIds: missingRequired },
                { status: 400 }
            );
        }

        for (const section of submittedSections) {
            for (const input of section.inputs || []) {
                if (!input?.id) continue;
                const tmpl = templateSections.flatMap((s) => s.inputs || []).find((i) => i.id === input.id);
                if (tmpl && isSkippedPaymentTemplateField(tmpl)) {
                    return NextResponse.json(
                        { error: 'Payment fields must not be submitted for group members' },
                        { status: 400 }
                    );
                }
            }
        }

        const { data: reg, error: regErr } = await admin
            .from('Registration')
            .select('id, user_id, event_id, profile_pending, status')
            .eq('ticket_token', tokenStr)
            .maybeSingle();

        if (regErr || !reg) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
        }

        if (!reg.profile_pending) {
            return NextResponse.json({ error: 'Profile already completed' }, { status: 409 });
        }

        if (Number(reg.event_id) !== numericEventId) {
            return NextResponse.json({ error: 'Link does not match this event' }, { status: 400 });
        }

        const { data: regUser } = await admin.from('User').select('email').eq('id', reg.user_id).maybeSingle();
        const regEmail = regUser?.email ? normalizeEmail(regUser.email) : '';
        if (!regEmail || normalizeEmail(user.email) !== regEmail) {
            return NextResponse.json({ error: 'Signed in as a different account' }, { status: 403 });
        }

        const { error: entryErr } = await admin.from('OrderFormEntries').insert([
            {
                event_id: numericEventId,
                order_form_id: existingForm.id,
                form_data: formData,
                user_email: regEmail,
                registration_id: reg.id,
            },
        ]);

        if (entryErr) {
            return NextResponse.json({ error: entryErr.message }, { status: 500 });
        }

        const registrationStatus =
            typeof reg.status === 'string' ? reg.status.toLowerCase() : String(reg.status || '').toLowerCase();

        const { error: updErr } = await admin
            .from('Registration')
            .update({ profile_pending: false })
            .eq('id', reg.id);

        if (updErr) {
            return NextResponse.json({ error: updErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Your details have been saved.',
            registrationStatus,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
