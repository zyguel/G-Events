import { NextRequest } from 'next/server';
import { badRequest, internalServerError, ok } from '@/lib/utils/apiResponse';
import { normalizeRegisterInput, validateRegisterInput } from '@/lib/validation/register';

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
        return ok({
            fullName: normalized.fullName,
            email: normalized.email,
            valid: true,
        });
    } catch (error: unknown) {
        return internalServerError(error instanceof Error ? error.message : 'Failed to validate registration input');
    }
}