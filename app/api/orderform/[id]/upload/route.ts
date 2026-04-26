import { NextRequest, NextResponse } from 'next/server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-server';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ORDER_FORM_BUCKET_LABEL = 'Order Form';
const DEFAULT_ORDER_FORM_BUCKET_ID = 'order-form';

type StorageBucketInfo = {
  id?: string;
  name?: string;
  public?: boolean;
};

function normalizeBucketToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sanitizeSegment(value: string | null, fallback: string): string {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return normalized || fallback;
}

function buildSafeFileName(file: File): string {
  const rawName = file.name || 'upload';
  const lastDot = rawName.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < rawName.length - 1;
  const base = hasExtension ? rawName.slice(0, lastDot) : rawName;
  const extension = hasExtension ? rawName.slice(lastDot + 1) : '';

  const safeBase = base
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';

  const safeExtension = extension
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 10);

  const suffix = crypto.randomUUID().slice(0, 8);
  return `${Date.now()}-${suffix}-${safeBase}${safeExtension ? `.${safeExtension}` : ''}`;
}

async function resolveOrderFormBucketId(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>
): Promise<string> {
  const { data, error } = await adminClient.storage.listBuckets();
  if (error) {
    throw new Error(error.message || 'Unable to list storage buckets.');
  }

  const normalizedTarget = normalizeBucketToken(ORDER_FORM_BUCKET_LABEL);
  const buckets = (data || []) as StorageBucketInfo[];

  const matchingBucket = buckets.find((bucket) => {
    const idMatch = normalizeBucketToken(bucket.id || '') === normalizedTarget;
    const nameMatch = normalizeBucketToken(bucket.name || '') === normalizedTarget;
    return idMatch || nameMatch;
  });

  if (matchingBucket?.id) {
    if (!matchingBucket.public) {
      const { error: updateError } = await adminClient.storage.updateBucket(matchingBucket.id, {
        public: true,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to set Order Form bucket visibility.');
      }
    }

    return matchingBucket.id;
  }

  const { error: createError } = await adminClient.storage.createBucket(DEFAULT_ORDER_FORM_BUCKET_ID, {
    public: true,
    fileSizeLimit: '10MB',
  });

  if (createError && !/already exists/i.test(createError.message || '')) {
    throw new Error(createError.message || 'Failed to create Order Form storage bucket.');
  }

  return DEFAULT_ORDER_FORM_BUCKET_ID;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;
    const orderFormId = Number.parseInt(id, 10);
    if (!Number.isFinite(orderFormId)) {
      return NextResponse.json({ success: false, error: 'Invalid order form ID' }, { status: 400 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size must be 10MB or smaller' },
        { status: 400 }
      );
    }

    const requestedEventIdRaw = formData.get('eventId');
    const requestedEventId =
      typeof requestedEventIdRaw === 'string' && requestedEventIdRaw.trim().length > 0
        ? Number.parseInt(requestedEventIdRaw, 10)
        : null;

    if (requestedEventIdRaw !== null && (!requestedEventId || !Number.isFinite(requestedEventId))) {
      return NextResponse.json({ success: false, error: 'Invalid eventId' }, { status: 400 });
    }

    const fieldIdentifierRaw = formData.get('fieldIdentifier');
    const fieldIdentifier = typeof fieldIdentifierRaw === 'string' ? fieldIdentifierRaw : null;

    const adminClient = await createAdminClient();

    const { data: orderFormRow, error: orderFormError } = await adminClient
      .from('OrderForm')
      .select('id, event_id')
      .eq('id', orderFormId)
      .maybeSingle();

    if (orderFormError) {
      return NextResponse.json(
        { success: false, error: orderFormError.message || 'Failed to verify order form' },
        { status: 500 }
      );
    }

    if (!orderFormRow) {
      return NextResponse.json({ success: false, error: 'Order form not found' }, { status: 404 });
    }

    if (requestedEventId && requestedEventId !== orderFormRow.event_id) {
      return NextResponse.json(
        { success: false, error: 'Order form does not belong to this event' },
        { status: 400 }
      );
    }

    const { data: eventRow, error: eventError } = await adminClient
      .from('Event')
      .select('id, is_published, is_visible')
      .eq('id', orderFormRow.event_id)
      .maybeSingle();

    if (eventError) {
      return NextResponse.json(
        { success: false, error: eventError.message || 'Failed to verify event' },
        { status: 500 }
      );
    }

    if (!eventRow || !eventRow.is_published || !eventRow.is_visible) {
      return NextResponse.json(
        { success: false, error: 'Event is not available for registration' },
        { status: 403 }
      );
    }

    const bucketId = await resolveOrderFormBucketId(adminClient);
    const safeFieldSegment = sanitizeSegment(fieldIdentifier, 'upload');
    const safeFileName = buildSafeFileName(fileEntry);
    const objectPath = `event-${orderFormRow.event_id}/order-form-${orderFormId}/${safeFieldSegment}/${safeFileName}`;

    const { error: uploadError } = await adminClient.storage
      .from(bucketId)
      .upload(objectPath, fileEntry, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileEntry.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(bucketId).getPublicUrl(objectPath);

    return NextResponse.json({
      success: true,
      bucketId,
      path: objectPath,
      publicUrl,
      fileName: fileEntry.name,
      mimeType: fileEntry.type,
      size: fileEntry.size,
    });
  } catch (error: unknown) {
    const authError = getAuthErrorResponse(error);
    if (authError) return authError;

    if (process.env.NODE_ENV === 'development') {
        console.error('Order form file upload error:', error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected upload error',
      },
      { status: 500 }
    );
  }
}
