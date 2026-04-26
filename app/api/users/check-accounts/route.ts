import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { ok, badRequest, internalServerError } from '@/lib/utils/apiResponse';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
    try {
        await requireUser();
        const body = await request.json();
        const { emails } = body;

        if (!emails || !Array.isArray(emails)) {
            return badRequest('Missing or invalid emails array');
        }

        // Normalize and dedupe emails to reduce auth admin pagination work.
        const normalizedEmails = Array.from(
            new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))
        );

        if (normalizedEmails.length === 0) {
            return badRequest('At least one valid email is required');
        }
        
        const supabase = await createAdminClient();

        const foundEmails = new Set<string>();

        // Source of truth: Supabase Auth users.
        // listUsers is paginated, so continue until all targets are found or there are no more pages.
        const targetEmails = new Set(normalizedEmails);
        const perPage = 1000;
        let page = 1;
        let hasMore = true;

        while (hasMore && foundEmails.size < targetEmails.size) {
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page, perPage });

            if (authError) {
                logger.error('api/users/check-accounts', 'Error checking auth users', authError);
                return internalServerError('Failed to check accounts');
            }

            const users = authData?.users || [];
            for (const user of users) {
                const email = String(user.email || '').trim().toLowerCase();
                if (email && targetEmails.has(email)) {
                    foundEmails.add(email);
                }
            }

            hasMore = users.length === perPage;
            page += 1;
        }
        
        // Compatibility fallback: include existing app User rows as valid too.
        if (foundEmails.size < targetEmails.size) {
            const { data, error } = await supabase
                .from('User')
                .select('email')
                .in('email', normalizedEmails);

            if (error) {
                logger.error('api/users/check-accounts', 'Error checking user profiles fallback', error);
                return internalServerError('Failed to check accounts');
            }

            for (const row of data || []) {
                const email = String(row.email || '').trim().toLowerCase();
                if (email && targetEmails.has(email)) {
                    foundEmails.add(email);
                }
            }
        }

        const results = emails.reduce((acc, email) => {
            acc[email] = foundEmails.has(String(email).trim().toLowerCase());
            return acc;
        }, {} as Record<string, boolean>);

        return ok(results);
    } catch (error: unknown) {
        logger.error('api/users/check-accounts', 'Unexpected error', error);
        return internalServerError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
}
