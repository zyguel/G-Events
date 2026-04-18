import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/apiAuth';
import { normalizeLocale } from '@/lib/i18n';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await requireUser();
    const email = user.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Missing user email' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('User')
      .select('preferred_language, preferred_region')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const locale = normalizeLocale({
      language: data?.preferred_language,
      region: data?.preferred_region,
    });

    return NextResponse.json(
      { success: true, data: locale },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=900',
        },
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch locale settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser();
    const email = user.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Missing user email' }, { status: 400 });
    }

    const body = await request.json();
    const locale = normalizeLocale({
      language: body?.language,
      region: body?.region,
    });

    const { data: existingUser, error: lookupError } = await supabase
      .from('User')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ success: false, error: lookupError.message }, { status: 500 });
    }

    let data:
      | { preferred_language: string | null; preferred_region: string | null }
      | null = null;
    let error: { message: string } | null = null;

    if (existingUser?.id) {
      const updateResult = await supabase
        .from('User')
        .update({
          preferred_language: locale.language,
          preferred_region: locale.region,
        })
        .eq('id', existingUser.id)
        .select('preferred_language, preferred_region')
        .single();

      data = updateResult.data;
      error = updateResult.error;
    } else {
      const insertResult = await supabase
        .from('User')
        .insert({
          email,
          preferred_language: locale.language,
          preferred_region: locale.region,
        })
        .select('preferred_language, preferred_region')
        .single();

      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: normalizeLocale({
        language: data?.preferred_language ?? undefined,
        region: data?.preferred_region ?? undefined,
      }),
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json({ success: false, error: 'Failed to update locale settings' }, { status: 500 });
  }
}
