"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye } from "lucide-react"
import Modal from "@/components/admin/Modal"
import TablePaginationControls from "@/components/admin/TablePaginationControls"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return auditEntries.slice(start, start + rowsPerPage)
  }, [auditEntries, currentPage, rowsPerPage])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(auditEntries.length / rowsPerPage))
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [auditEntries.length, currentPage, rowsPerPage])

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

  const openDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  const closeDetails = () => {
    setIsDetailsOpen(false)
    setSelectedEntry(null)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Audit trail</h2>

      {loading && <p className="text-sm text-gray-500">Loading audit records...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && auditEntries.length === 0 && (
        <p className="text-sm text-gray-500">No audit activity recorded yet for this entity.</p>
      )}

      {!loading && !error && auditEntries.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-2 py-2">When</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">Hash</th>
                  <th className="px-2 py-2">Prev Hash</th>
                  <th className="px-2 py-2">IPFS</th>
                  <th className="px-2 py-2">View</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-2 py-2">{new Date(entry.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2 font-medium">{entry.action}</td>
                    <td className="px-2 py-2 truncate max-w-62.5" title={entry.audit_hash}>{entry.audit_hash}</td>
                    <td className="px-2 py-2 truncate max-w-62.5" title={entry.prev_hash || ''}>{entry.prev_hash || '-'}</td>
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
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => openDetails(entry)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#3D518C] dark:hover:text-blue-300 hover:border-[#3D518C]/40 dark:hover:border-blue-400/40 transition-colors"
                        aria-label={`View audit log ${entry.id} details`}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePaginationControls
            totalItems={auditEntries.length}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setCurrentPage(1)
            }}
          />

          <Modal
            isOpen={isDetailsOpen}
            onClose={closeDetails}
            title="Audit log details"
            subtitle={selectedEntry ? `${selectedEntry.entity_type} #${selectedEntry.entity_id ?? '-'}` : undefined}
            size="lg"
          >
            {selectedEntry && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Log ID</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedEntry.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedEntry.action}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Entity</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedEntry.entity_type} #{selectedEntry.entity_id ?? '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Audit Hash</p>
                  <p className="font-mono text-xs break-all rounded-lg bg-gray-50 dark:bg-gray-900/60 p-3 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    {selectedEntry.audit_hash}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Previous Hash</p>
                  <p className="font-mono text-xs break-all rounded-lg bg-gray-50 dark:bg-gray-900/60 p-3 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    {selectedEntry.prev_hash || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">IPFS CID</p>
                  {selectedEntry.ipfs_cid ? (
                    <a
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      href={`https://ipfs.io/ipfs/${selectedEntry.ipfs_cid}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedEntry.ipfs_cid}
                    </a>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">-</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Payload</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap wrap-break-word rounded-lg bg-gray-50 dark:bg-gray-900/60 p-3 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 max-h-64 overflow-auto">
                    {JSON.stringify(selectedEntry.payload ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </section>
  )
}
