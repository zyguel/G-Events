import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { badRequest, internalServerError, ok } from '@/lib/utils/apiResponse';
import { normalizeRegisterInput, validateRegisterInput } from '@/lib/validation/register';

export const runtime = 'nodejs';

type RegisterValidatePayload = {
    fullName?: unknown;
    email?: unknown;
    password?: unknown;
};

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RegisterValidatePayload;
        const payload = {
            fullName: asString(body?.fullName),
            email: asString(body?.email),
            password: asString(body?.password),
        };

        const validationError = validateRegisterInput(payload);
        if (validationError) {
            return badRequest(validationError);
        }

        const normalized = normalizeRegisterInput(payload);

        // Check if email already exists in the system
        const supabase = await createClient();
        const { data: existingUser } = await supabase
            .from('User')
            .select('email')
            .eq('email', normalized.email)
            .maybeSingle();

        if (existingUser) {
            return badRequest('An account with this email already exists. Please log in instead.');
        }

        // Note: DNS validation removed - it was causing false positives for valid email domains.
        // Email validation happens at the format level above, and Supabase will verify
        // deliverability when sending the confirmation email.

        return ok({
            fullName: normalized.fullName,
            email: normalized.email,
            valid: true,
        });
    } catch (error: unknown) {
        return internalServerError(error instanceof Error ? error.message : 'Failed to validate registration input');
    }
}