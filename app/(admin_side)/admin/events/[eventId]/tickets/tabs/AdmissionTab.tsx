"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, AlertCircle, Ticket as TicketIcon, Users, ShoppingCart, Archive, EyeOff, CalendarRange, Undo2, Trash, Loader2 } from "lucide-react";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "@/components/admin/Modal";
import DateInput from "@/components/admin/DateInput";
import TimeInput from "@/components/admin/TimeInput";
import { getTickets, createTicket, updateTicket, deleteTicket, restoreTicket, Ticket } from "@/lib/eventManagement";
import { motion, AnimatePresence } from "framer-motion";
import { EventSummary } from "@/lib/types";

interface AdmissionTabProps {
  event: EventSummary;
}

const DATE_PART_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PART_PATTERN = /^\d{2}:\d{2}$/;
const SELL_WINDOW_BUFFER_MS = 5 * 24 * 60 * 60 * 1000;

const parseDateTimeInput = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [datePart, timePartRaw] = trimmed.split("T");
  if (!DATE_PART_PATTERN.test(datePart)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [year, month, day] = datePart.split("-").map((part) => Number.parseInt(part, 10));
  let hours = 0;
  let minutes = 0;

  if (timePartRaw) {
    const normalizedTime = timePartRaw.slice(0, 5);
    if (!TIME_PART_PATTERN.test(normalizedTime)) {
      return null;
    }
    const [h, m] = normalizedTime.split(":").map((part) => Number.parseInt(part, 10));
    hours = h;
    minutes = m;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const formatDatePart = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimePart = (value: Date): string => {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateTimeLocal = (value: Date): string => `${formatDatePart(value)}T${formatTimePart(value)}`;

const getDatePartFromValue = (value: string): string | null => {
  const datePart = value.split("T")[0] ?? "";
  return DATE_PART_PATTERN.test(datePart) ? datePart : null;
};

const getTimePartFromValue = (value: string): string => {
  const timePart = value.includes("T") ? value.split("T")[1] ?? "" : "";
  const normalizedTime = timePart.slice(0, 5);
  return TIME_PART_PATTERN.test(normalizedTime) ? normalizedTime : "";
};

const initialTicketForm: Omit<Ticket, "id" | "createdAt" | "usedQuantity"> = {

  name: "",
  type: "paid",
  freeTicketApprovalMode: "manual",
  quantity: 0,
  waitlistReservedQuantity: 0,
  price: 0,
  currency: "PHP",
  startDate: "",
  endDate: "",
  timezone: "Asia/Manila",
  description: "",
  visibility: "visible",
  isDeleted: false,
};

export default function AdmissionTab({ event }: AdmissionTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [deletedTickets, setDeletedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialTicketForm);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const [restoringTicketId, setRestoringTicketId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const eventEndAt = parseDateTimeInput(event.eventEndAt);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getTickets(event.id, { includeDeleted: true });
      setTickets(data.filter((ticket) => !ticket.isDeleted));
      setDeletedTickets(data.filter((ticket) => ticket.isDeleted));
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const startAt = parseDateTimeInput(formData.startDate);
    const endAt = parseDateTimeInput(formData.endDate);

    if (!formData.name.trim()) newErrors.name = "Ticket name is required";
    const normalizedName = formData.name.trim().toLowerCase();
    if (normalizedName) {
      const hasDuplicateName = tickets.some((ticket) =>
        ticket.id !== editingTicketId
        && ticket.name.trim().toLowerCase() === normalizedName
      );
      if (hasDuplicateName) {
        newErrors.name = "Ticket name must be unique";
      }
    }
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (formData.type === "paid" && !formData.price) newErrors.price = "Price is required for paid tickets";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (formData.startDate && !startAt) newErrors.startDate = "Invalid start date/time";
    if (formData.endDate && !endAt) newErrors.endDate = "Invalid end date/time";
    if (startAt && endAt && startAt >= endAt) {
      newErrors.endDate = "End date must be after start date";
    }
    if (eventEndAt && startAt && startAt > eventEndAt) {
      newErrors.startDate = "Start date/time cannot go beyond the event end date/time";
    }
    if (eventEndAt && endAt && endAt > eventEndAt) {
      newErrors.endDate = "End date/time cannot go beyond the event end date/time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeSellingWindow = (
    nextFormData: typeof formData,
    changedField: "startDate" | "endDate"
  ): { normalizedFormData: typeof formData; warningMessage: string | null } => {
    const normalized = { ...nextFormData };
    const warnings: string[] = [];

    if (eventEndAt) {
      const startAt = parseDateTimeInput(normalized.startDate);
      const endAt = parseDateTimeInput(normalized.endDate);

      if (startAt && startAt > eventEndAt) {
        normalized.startDate = formatDateTimeLocal(eventEndAt);
        warnings.push("Start date/time was adjusted to event end date/time.");
      }
      if (endAt && endAt > eventEndAt) {
        normalized.endDate = formatDateTimeLocal(eventEndAt);
        warnings.push("End date/time was adjusted to event end date/time.");
      }
    }

    let startAt = parseDateTimeInput(normalized.startDate);
    let endAt = parseDateTimeInput(normalized.endDate);

    if (startAt && endAt && startAt >= endAt) {
      if (changedField === "startDate") {
        const proposedEnd = new Date(startAt.getTime() + 60 * 1000);
        if (eventEndAt && proposedEnd > eventEndAt) {
          const bufferedStart = new Date(eventEndAt.getTime() - SELL_WINDOW_BUFFER_MS);
          normalized.startDate = formatDateTimeLocal(bufferedStart);
          normalized.endDate = formatDateTimeLocal(eventEndAt);
          warnings.push("Ticket sell window was reset to a 5-day buffer because the selected time reached the event boundary.");
        } else {
          normalized.endDate = formatDateTimeLocal(proposedEnd);
          warnings.push("End date/time was adjusted to stay after start date/time.");
        }
      } else {
        const adjustedStart = new Date(endAt.getTime() - 60 * 1000);
        normalized.startDate = formatDateTimeLocal(adjustedStart);
        warnings.push("Start date/time was adjusted to stay before end date/time.");
      }

      startAt = parseDateTimeInput(normalized.startDate);
      endAt = parseDateTimeInput(normalized.endDate);
    }

    if (startAt && endAt && startAt >= endAt) {
      const fallbackEnd = endAt || startAt;
      const fallbackStart = new Date(fallbackEnd.getTime() - SELL_WINDOW_BUFFER_MS);
      normalized.startDate = formatDateTimeLocal(fallbackStart);
      normalized.endDate = formatDateTimeLocal(fallbackEnd);
      warnings.push("Ticket sell window was normalized to keep a valid range.");
    }

    return {
      normalizedFormData: normalized,
      warningMessage: warnings.length > 0 ? warnings.join(" ") : null,
    };
  };

  const updateSellingWindowField = (field: "startDate" | "endDate", value: string) => {
    const { normalizedFormData, warningMessage } = normalizeSellingWindow({ ...formData, [field]: value }, field);
    setFormData(normalizedFormData);
    setDateWarning(warningMessage);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.startDate;
      delete next.endDate;
      return next;
    });
  };

  const handleAddTicket = () => {
    setEditingTicketId(null);
    setFormData(initialTicketForm);
    setShowAdvanced(false);
    setErrors({});
    setDateWarning(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setFormData({
      name: ticket.name,
      type: ticket.type,
      freeTicketApprovalMode: ticket.freeTicketApprovalMode,
      quantity: ticket.quantity,
      waitlistReservedQuantity: ticket.waitlistReservedQuantity || 0,
      price: ticket.price,
      currency: ticket.currency,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      timezone: ticket.timezone,
      description: ticket.description,
      visibility: ticket.visibility,
      isDeleted: ticket.isDeleted,
    });
    setShowAdvanced(true);
    setErrors({});
    setDateWarning(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveTicket = async () => {
    if (isSavingTicket) return;
    if (!validateForm()) return;

    try {
      setIsSavingTicket(true);
      setFormError(null);
      if (editingTicketId) {
        await updateTicket(event.id, editingTicketId, formData);
      } else {
        await createTicket(event.id, formData);
      }
      await loadTickets();
      setIsModalOpen(false);
      setDateWarning(null);
    } catch (error) {
      console.error("Failed to save ticket:", error);
      setFormError(error instanceof Error ? error.message : "Failed to save ticket");
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleDeleteClick = (ticketId: string) => {
    setDeleteTarget(ticketId);
    setDeleteError(null);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeletingTicket) return;

    try {
      setIsDeletingTicket(true);
      await deleteTicket(event.id, deleteTarget);
      await loadTickets();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      const message = error instanceof Error ? error.message : "Failed to delete ticket";
      setDeleteError(message);
    } finally {
      setIsDeletingTicket(false);
    }
  };

  const handleRestoreTicket = async (ticketId: string) => {
    if (restoringTicketId) return;
    try {
      setRestoringTicketId(ticketId);
      await restoreTicket(event.id, ticketId);
      await loadTickets();
    } catch (error) {
      console.error("Failed to restore ticket:", error);
    } finally {
      setRestoringTicketId(null);
    }
  };

  const totalCapacity = tickets.reduce((sum, ticket) => sum + Math.max(ticket.quantity || 0, 0), 0);
  const totalReservedForWaitlist = tickets.reduce((sum, ticket) => sum + Math.max(ticket.waitlistReservedQuantity || 0, 0), 0);
  const totalSold = tickets.reduce((sum, ticket) => sum + Math.max(ticket.usedQuantity || 0, 0), 0);
  const totalAvailable = Math.max(totalCapacity - totalSold - totalReservedForWaitlist, 0);
  const hiddenTickets = tickets.filter((ticket) => ticket.visibility === "hidden").length;

  const isTicketOnSale = (ticket: Ticket): boolean => {
    const now = new Date();
    const startAt = ticket.startDate ? new Date(ticket.startDate) : null;
    const endAt = ticket.endDate ? new Date(ticket.endDate) : null;

    if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return false;
    }

    return startAt <= now && now <= endAt;
  };

  const onSaleTickets = tickets.filter((ticket) => isTicketOnSale(ticket)).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admission Tickets</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Create and manage your event ticket tiers.</p>
        </div>
        <button
          onClick={handleAddTicket}
          disabled={isSavingTicket || isDeletingTicket}
          className="px-5 py-2.5 text-sm bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-white font-bold rounded-xl flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} />
          Add Ticket
        </button>
      </div>

      {/* Admission Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Ticket Types</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tickets.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TicketIcon size={18} className="text-blue-700 dark:text-blue-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{onSaleTickets} currently on sale</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Current Capacity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCapacity.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Users size={18} className="text-indigo-700 dark:text-indigo-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Across all admission ticket types</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalSold.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ShoppingCart size={18} className="text-amber-700 dark:text-amber-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total claimed registrations</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Tickets Left</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{totalAvailable.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Archive size={18} className="text-green-700 dark:text-green-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{hiddenTickets} hidden ticket {hiddenTickets === 1 ? "type" : "types"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-flex items-center gap-1">
            <Users size={12} />
            Reserved for waitlist: {totalReservedForWaitlist}
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No tickets created yet</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{ticket.name}</h3>
                      {ticket.visibility === "hidden" && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          <EyeOff size={12} />
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.type === "paid" ? `₱${ticket.price} ${ticket.currency}` : "Free"}
                    </p>
                    {ticket.type === "free" ? (
                      <p className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ticket.freeTicketApprovalMode === "automatic"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}>
                        {ticket.freeTicketApprovalMode === "automatic"
                          ? "QR auto-approval"
                          : "QR manual approval"}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {(() => {
                        const reservedForWaitlist = Math.max(ticket.waitlistReservedQuantity || 0, 0);
                        const leftForPublic = Math.max(ticket.quantity - ticket.usedQuantity - reservedForWaitlist, 0);

                        return (
                          <>
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              Capacity: {ticket.quantity}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              Sold: {ticket.usedQuantity}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              <Users size={12} />
                              Reserved: {reservedForWaitlist}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              Left: {leftForPublic}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarRange size={12} />
                        {ticket.startDate || "No start"} to {ticket.endDate || "No end"}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{ticket.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      disabled={isSavingTicket || isDeletingTicket}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(ticket.id)}
                      disabled={isSavingTicket || isDeletingTicket}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Deleted Tickets Bin */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Trash size={16} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deleted Tickets Bin</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Archived tickets can be restored anytime.</p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{deletedTickets.length} item{deletedTickets.length === 1 ? "" : "s"}</span>
        </div>

        {deletedTickets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No deleted tickets.</p>
        ) : (
          <div className="space-y-2">
            {deletedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Capacity {ticket.quantity} • Sold {ticket.usedQuantity}</p>
                </div>
                <button
                  onClick={() => handleRestoreTicket(ticket.id)}
                  disabled={restoringTicketId !== null}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#3D518C] text-white hover:bg-[#2f406f] transition-colors"
                >
                  {restoringTicketId === ticket.id ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Undo2 size={12} />
                      Restore
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (isSavingTicket) return;
          setIsModalOpen(false);
          setDateWarning(null);
          setFormError(null);
        }}
        title={editingTicketId ? "Edit Ticket" : "Add New Ticket"}
      >
        <div className="space-y-4">
          {/* Basic Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Ticket Name *</label>
              <span className={`text-[10px] font-medium tabular-nums ${
                formData.name.length >= 30 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {formData.name.length}/30
              </span>
            </div>
            <ModalInput
              type="text"
              maxLength={30}
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <div className="flex gap-3">
                {["paid", "free"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: type as "paid" | "free",
                        price: type === "free" ? 0 : formData.price,
                        freeTicketApprovalMode:
                          type === "paid" ? "manual" : formData.freeTicketApprovalMode,
                      })
                    }
                    className={`flex-1 py-2.5 px-3 min-h-10.5 rounded-xl font-medium transition-all shadow-sm text-sm ${formData.type === type
                      ? "bg-[#3D518C] text-white ring-2 ring-[#3D518C] ring-offset-2 dark:ring-offset-gray-800"
                      : "bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    {type === "paid" ? "Paid" : "Free"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <ModalInput
                type="number"
                min="1"
                placeholder="0"
                value={formData.quantity || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={`${errors.quantity ? "border-red-500" : ""} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              {errors.quantity && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {formData.type === "paid" && (
            <div>
              <label className="block text-sm font-medium mb-2">Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium z-10">
                  ₱
                </span>
                <ModalInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className={`pl-8 ${errors.price ? "border-red-500" : ""} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
              {errors.price && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.price}</p>}
            </div>
          )}

          {formData.type === "free" ? (
            <div className="rounded-xl border border-indigo-200/70 dark:border-indigo-700/50 bg-indigo-50/70 dark:bg-indigo-900/20 p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Free Ticket QR Approval</h3>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                  Choose whether QR passes are issued immediately after submission or only after organizer approval.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, freeTicketApprovalMode: "manual" })}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${formData.freeTicketApprovalMode === "manual"
                    ? "border-indigo-500 bg-indigo-100/80 dark:bg-indigo-800/50 text-indigo-900 dark:text-indigo-100"
                    : "border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  <p className="font-semibold">Manual approval</p>
                  <p className="mt-1 text-xs opacity-80">Ticket stays pending until organizer confirms.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, freeTicketApprovalMode: "automatic" })}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${formData.freeTicketApprovalMode === "automatic"
                    ? "border-indigo-500 bg-indigo-100/80 dark:bg-indigo-800/50 text-indigo-900 dark:text-indigo-100"
                    : "border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  <p className="font-semibold">Automatic approval</p>
                  <p className="mt-1 text-xs opacity-80">Issue QR immediately on successful registration.</p>
                </button>
              </div>
            </div>
          ) : null}

          {/* Date & Time */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date & Time *</label>
              <div className="flex gap-2">
                <div className="w-[55%]">
                  <DateInput
                    value={formData.startDate ? new Date(formData.startDate.split('T')[0]) : null}
                    onChange={(date) => {
                      if (!date) {
                        updateSellingWindowField("startDate", "");
                        return;
                      }
                      const dateStr = formatDatePart(date);
                      const timeStr = getTimePartFromValue(formData.startDate);
                      const nextValue = timeStr ? `${dateStr}T${timeStr}` : dateStr;
                      updateSellingWindowField("startDate", nextValue);
                    }}
                    placeholder="Select date"
                    className={errors.startDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
                <div className="w-[45%]">
                  <TimeInput
                    value={getTimePartFromValue(formData.startDate)}
                    onChange={(time) => {
                      const now = new Date();
                      const datePart = getDatePartFromValue(formData.startDate)
                        || formatDatePart(now);
                      updateSellingWindowField("startDate", time ? `${datePart}T${time}` : datePart);
                    }}
                    placeholder="Time"
                    className={errors.startDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
              </div>
              {errors.startDate && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date & Time *</label>
              <div className="flex gap-2">
                <div className="w-[55%]">
                  <DateInput
                    value={formData.endDate ? new Date(formData.endDate.split('T')[0]) : null}
                    onChange={(date) => {
                      if (!date) {
                        updateSellingWindowField("endDate", "");
                        return;
                      }
                      const dateStr = formatDatePart(date);
                      const timeStr = getTimePartFromValue(formData.endDate);
                      const nextValue = timeStr ? `${dateStr}T${timeStr}` : dateStr;
                      updateSellingWindowField("endDate", nextValue);
                    }}
                    placeholder="Select date"
                    className={errors.endDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
                <div className="w-[45%]">
                  <TimeInput
                    value={getTimePartFromValue(formData.endDate)}
                    onChange={(time) => {
                      const now = new Date();
                      const datePart = getDatePartFromValue(formData.endDate)
                        || formatDatePart(now);
                      updateSellingWindowField("endDate", time ? `${datePart}T${time}` : datePart);
                    }}
                    placeholder="Time"
                    className={errors.endDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
              </div>
              {errors.endDate && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {dateWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{dateWarning}</p>
              </div>
            </div>
          )}


          {/* Timezone Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <AlertCircle size={14} />
            <span>
              Timezone is PHT, UTC + 8
              {eventEndAt ? ` • Ticket sales cannot go beyond ${formatDateTimeLocal(eventEndAt)}` : ""}
            </span>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-[#3D518C] hover:underline font-medium"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Settings
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 border-t border-gray-300 dark:border-gray-600 pt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <ModalTextarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.visibility === "visible"}
                    onChange={(e) =>
                      setFormData({ ...formData, visibility: e.target.checked ? "visible" : "hidden" })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Visible to attendees</span>
                </label>
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => {
              setIsModalOpen(false);
              setDateWarning(null);
              setFormError(null);
            }}
            onSave={handleSaveTicket}
            saveText={editingTicketId ? "Update Ticket" : "Create Ticket"}
            submitType="button"
            isSubmitting={isSavingTicket}
          />
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {formError}
            </div>
          )}
        </div>
      </Modal >

      {/* Delete Confirmation Modal */}
      < Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          if (isDeletingTicket) return;
          setIsConfirmDeleteOpen(false);
          setDeleteError(null);
        }}
        title="Delete Ticket"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this ticket?</p>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {deleteError}
            </div>
          )}
          <ModalFooter
            onCancel={() => {
              setIsConfirmDeleteOpen(false);
              setDeleteError(null);
            }}
            onSave={handleConfirmDelete}
            saveText="Delete"
            submitType="button"
            isDanger={true}
            isSubmitting={isDeletingTicket}
          />
        </div>
      </Modal >
    </div >
  );
}
