"use client"

import { useEffect, useState } from "react"

interface AuditEntry {
  id: number
  entity_type: string
  entity_id: number | null
  action: string
  payload: Record<string, unknown>
  audit_hash: string
  prev_hash: string | null
  ipfs_cid: string | null
  created_at: string
}

interface AuditLogViewerProps {
  entityType: string
  entityId: number
}

export default function AuditLogViewer({ entityType, entityId }: AuditLogViewerProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAudit() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/audit?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId.toString())}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load audit log')
        }

        setAuditEntries(data.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message || 'Unexpected error')
      } finally {
        setLoading(false)
      }
    }

    if (entityId) {
      fetchAudit()
    } else {
      setLoading(false)
    }
  }, [entityType, entityId])

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Audit trail</h2>

      {loading && <p className="text-sm text-gray-500">Loading audit records...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && auditEntries.length === 0 && (
        <p className="text-sm text-gray-500">No audit activity recorded yet for this entity.</p>
      )}

      {!loading && !error && auditEntries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">Hash</th>
                <th className="px-2 py-2">Prev Hash</th>
                <th className="px-2 py-2">IPFS</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-2 py-2">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-2 py-2 font-medium">{entry.action}</td>
                  <td className="px-2 py-2 truncate max-w-[250px]" title={entry.audit_hash}>{entry.audit_hash}</td>
                  <td className="px-2 py-2 truncate max-w-[250px]" title={entry.prev_hash || ''}>{entry.prev_hash || '-'}</td>
                  <td className="px-2 py-2">
                    {entry.ipfs_cid ? (
                      <a
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        href={`https://ipfs.io/ipfs/${entry.ipfs_cid}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {entry.ipfs_cid}
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
