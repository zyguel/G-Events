import { NextRequest, NextResponse } from 'next/server'
import { getAuditEntries, AuditEntityType } from '@/lib/actions/audit'
import { requireUser } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    await requireUser()

    const entityType = request.nextUrl.searchParams.get('entityType')
    const entityIdParam = request.nextUrl.searchParams.get('entityId')

    if (!entityType) {
      return NextResponse.json({ success: false, error: 'entityType is required' }, { status: 400 })
    }

    const entityId = entityIdParam ? parseInt(entityIdParam, 10) : null
    if (entityIdParam && isNaN(entityId as number)) {
      return NextResponse.json({ success: false, error: 'invalid entityId' }, { status: 400 })
    }

    const auditRows = await getAuditEntries(entityType as AuditEntityType, entityId)
    return NextResponse.json({ success: true, data: auditRows })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('API GET /api/audit error:', message)
    return NextResponse.json({ success: false, error: message || 'Unexpected error' }, { status: 500 })
  }
}
