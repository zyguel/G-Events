import { NextRequest } from 'next/server';
import { promises as dns } from 'node:dns';
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

const RESERVED_EMAIL_DOMAINS = new Set([
    'example.com',
    'example.net',
    'example.org',
    'invalid',
    'localhost',
    'test',
]);

function isReservedEmailDomain(domain: string): boolean {
    const normalized = domain.trim().toLowerCase();
    if (RESERVED_EMAIL_DOMAINS.has(normalized)) return true;
    return (
        normalized.endsWith('.example')
        || normalized.endsWith('.invalid')
        || normalized.endsWith('.localhost')
        || normalized.endsWith('.test')
    );
}

async function resolveDomainHasMailEndpoint(domain: string): Promise<boolean> {
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords.some((record) => Boolean(record.exchange) && record.exchange !== '.')) {
            return true;
        }
    } catch {
        // Fall back to A/AAAA checks below.
    }

    try {
        const ipv4Records = await dns.resolve4(domain);
        if (ipv4Records.length > 0) {
            return true;
        }
    } catch {
        // Fall back to AAAA checks below.
    }

    try {
        const ipv6Records = await dns.resolve6(domain);
        if (ipv6Records.length > 0) {
            return true;
        }
    } catch {
        return false;
    }

    return false;
}

async function validateEmailDomain(email: string): Promise<string | null> {
    const atIndex = email.lastIndexOf('@');
    if (atIndex < 1 || atIndex === email.length - 1) {
        return 'Please provide a valid email address.';
    }

    const domain = email.slice(atIndex + 1).trim().toLowerCase();
    if (!domain) {
        return 'Please provide a valid email address.';
    }

    if (isReservedEmailDomain(domain)) {
        return 'Please use a real email address.';
    }

    const isDeliverableDomain = await resolveDomainHasMailEndpoint(domain);
    if (!isDeliverableDomain) {
        return 'Email domain cannot receive mail. Please use a valid email address.';
    }

    return null;
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
        const domainValidationError = await validateEmailDomain(normalized.email);
        if (domainValidationError) {
            return badRequest(domainValidationError);
        }

        return ok({
            fullName: normalized.fullName,
            email: normalized.email,
            valid: true,
        });
    } catch (error: unknown) {
        return internalServerError(error instanceof Error ? error.message : 'Failed to validate registration input');
    }
}