import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { ok, badRequest, internalServerError } from '@/lib/utils/apiResponse';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { emails } = body;

        if (!emails || !Array.isArray(emails)) {
            return badRequest('Missing or invalid emails array');
        }

        // Normalize emails
        const normalizedEmails = emails.map(e => String(e).trim().toLowerCase());
        
        const supabase = await createAdminClient();
        
        // Check "User" table (public schema) using service role to bypass RLS
        const { data, error } = await supabase
            .from('User')
            .select('email')
            .in('email', normalizedEmails);

        if (error) {
            logger.error('api/users/check-accounts', 'Error checking accounts', error);
            return internalServerError('Failed to check accounts');
        }

        // Create a map of email -> exists
        const foundEmails = new Set((data || []).map(u => u.email.toLowerCase()));
        const results = emails.reduce((acc, email) => {
            acc[email] = foundEmails.has(email.toLowerCase());
            return acc;
        }, {} as Record<string, boolean>);

        return ok(results);
    } catch (error: unknown) {
        logger.error('api/users/check-accounts', 'Unexpected error', error);
        return internalServerError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
}
