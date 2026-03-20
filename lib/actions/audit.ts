import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase-server'

export type AuditEntityType =
  | 'Event'
  | 'Ticket'
  | 'Promotion'
  | 'AddOn'
  | 'OrderForm'
  | 'OrderFormEntry'
  | 'Registration'
  | 'User'

export type AuditAction = 'create' | 'update' | 'delete'

function normalizeObject(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item) => normalizeObject(item))
  }

  const obj = value as Record<string, unknown>
  const sortedKeys = Object.keys(obj).sort()
  const normalized: Record<string, unknown> = {}
  for (const key of sortedKeys) {
    normalized[key] = normalizeObject(obj[key])
  }
  return normalized
}

async function computeAuditHash(payload: unknown): Promise<string> {
  const normalizedPayload = normalizeObject(payload)
  const stringified = JSON.stringify(normalizedPayload)
  return createHash('sha256').update(stringified).digest('hex')
}

export async function logAuditEntry(
  entityType: AuditEntityType,
  entityId: number | null,
  action: AuditAction,
  payload: unknown,
  ipfsCid?: string
) {
  const supabase = await createClient()

  const auditHash = await computeAuditHash({ entityType, entityId, action, payload, ipfsCid, timestamp: new Date().toISOString() })

  // previous hash for this entity (optional chain anchoring)
  const { data: latest, error: latestError } = await supabase
    .from('AuditLog')
    .select('audit_hash')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (latestError && latestError.code !== 'PGRST116') {
    console.warn('AuditLog fetch previous hash failed', latestError)
  }

  const prevHash = latest?.audit_hash || null

  const { error } = await supabase
    .from('AuditLog')
    .insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        action,
        payload,
        audit_hash: auditHash,
        prev_hash: prevHash,
        ipfs_cid: ipfsCid || null,
        created_at: new Date().toISOString(),
      },
    ])

  if (error) {
    console.error('Failed to insert audit log', error)
    throw error
  }

  return { auditHash, prevHash }
}

export async function getAuditEntries(entityType: AuditEntityType, entityId: number | null) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('AuditLog')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load audit entries', error)
    throw error
  }

  return data
}
