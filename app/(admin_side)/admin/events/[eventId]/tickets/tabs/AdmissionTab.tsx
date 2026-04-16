"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, AlertCircle, Ticket as TicketIcon, Users, ShoppingCart, Archive, EyeOff, CalendarRange, Undo2, Trash } from "lucide-react";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "@/components/admin/Modal";
import DateInput from "@/components/admin/DateInput";
import TimeInput from "@/components/admin/TimeInput";
import { getTickets, createTicket, updateTicket, deleteTicket, restoreTicket, Ticket } from "@/lib/eventManagement";
import { motion, AnimatePresence } from "framer-motion";
import { EventSummary } from "@/lib/types";

interface AdmissionTabProps {
  event: EventSummary;
}

const initialTicketForm: Omit<Ticket, "id" | "createdAt" | "usedQuantity"> = {

  name: "",
  type: "paid",
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
  minQuantity: 1,
  maxQuantity: 1,
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

    if (!formData.name.trim()) newErrors.name = "Ticket name is required";
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (formData.type === "paid" && !formData.price) newErrors.price = "Price is required for paid tickets";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (formData.minQuantity > formData.maxQuantity) {
      newErrors.maxQuantity = "Max quantity must be greater than min quantity";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTicket = () => {
    setEditingTicketId(null);
    setFormData(initialTicketForm);
    setShowAdvanced(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setFormData({
      name: ticket.name,
      type: ticket.type,
      quantity: ticket.quantity,
      price: ticket.price,
      currency: ticket.currency,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      timezone: ticket.timezone,
      description: ticket.description,
      visibility: ticket.visibility,
      isDeleted: ticket.isDeleted,
      minQuantity: ticket.minQuantity,
      maxQuantity: ticket.maxQuantity,
    });
    setShowAdvanced(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSaveTicket = async () => {
    if (!validateForm()) return;

    try {
      if (editingTicketId) {
        await updateTicket(event.id, editingTicketId, formData);
      } else {
        await createTicket(event.id, formData);
      }
      await loadTickets();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save ticket:", error);
    }
  };

  const handleDeleteClick = (ticketId: string) => {
    setDeleteTarget(ticketId);
    setDeleteError(null);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTicket(event.id, deleteTarget);
      await loadTickets();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      const message = error instanceof Error ? error.message : "Failed to delete ticket";
      setDeleteError(message);
    }
  };

  const handleRestoreTicket = async (ticketId: string) => {
    try {
      await restoreTicket(event.id, ticketId);
      await loadTickets();
    } catch (error) {
      console.error("Failed to restore ticket:", error);
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
      <div className="flex justify-between items-center">

        <button
          onClick={handleAddTicket}
          className="px-4 py-2 text-sm bg-linear-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.05] transition-all duration-200 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
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
                      <span>Per order: {ticket.minQuantity} min - {ticket.maxQuantity} max</span>
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
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(ticket.id)}
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
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#3D518C] text-white hover:bg-[#2f406f] transition-colors"
                >
                  <Undo2 size={12} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTicketId ? "Edit Ticket" : "Add New Ticket"}
      >
        <div className="space-y-4">
          {/* Basic Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Ticket Name *</label>
            <ModalInput
              type="text"
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
                    onClick={() => setFormData({ ...formData, type: type as "paid" | "free" })}
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
                className={errors.quantity ? "border-red-500" : ""}
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
                  className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                />
              </div>
              {errors.price && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.price}</p>}
            </div>
          )}

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
                        setFormData({ ...formData, startDate: "" });
                        return;
                      }
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const timeStr = formData.startDate && formData.startDate.includes('T') ? formData.startDate.split('T')[1] : "";
                      setFormData({ ...formData, startDate: timeStr ? `${dateStr}T${timeStr}` : dateStr });
                    }}
                    placeholder="Select date"
                    className={errors.startDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
                <div className="w-[45%]">
                  <TimeInput
                    value={formData.startDate && formData.startDate.includes('T') ? formData.startDate.split('T')[1] : ""}
                    onChange={(time) => {
                      const now = new Date();
                      const datePart = formData.startDate && formData.startDate.includes('T') ? formData.startDate.split('T')[0] :
                        (formData.startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                      setFormData({ ...formData, startDate: time ? `${datePart}T${time}` : datePart });
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
                        setFormData({ ...formData, endDate: "" });
                        return;
                      }
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const timeStr = formData.endDate && formData.endDate.includes('T')
                        ? formData.endDate.split('T')[1]
                        : "";
                      setFormData({ ...formData, endDate: timeStr ? `${dateStr}T${timeStr}` : dateStr });
                    }}
                    placeholder="Select date"
                    className={errors.endDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
                <div className="w-[45%]">
                  <TimeInput
                    value={formData.endDate && formData.endDate.includes('T') ? formData.endDate.split('T')[1] : ""}
                    onChange={(time) => {
                      const now = new Date();
                      const datePart = formData.endDate && formData.endDate.includes('T') ? formData.endDate.split('T')[0] :
                        (formData.endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                      setFormData({ ...formData, endDate: time ? `${datePart}T${time}` : datePart });
                    }}
                    placeholder="Time"
                    className={errors.endDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
              </div>
              {errors.endDate && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.endDate}</p>}
            </div>
          </div>


          {/* Timezone Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <AlertCircle size={14} />
            <span>Timezone is PHT, UTC + 8</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Quantity per Order</label>
                  <ModalInput
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Quantity per Order</label>
                  <ModalInput
                    type="number"
                    min="1"
                    value={formData.maxQuantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
                    className={errors.maxQuantity ? "border-red-500" : ""}
                  />
                  {errors.maxQuantity && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.maxQuantity}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => setIsModalOpen(false)}
            onSave={handleSaveTicket}
            saveText={editingTicketId ? "Update Ticket" : "Create Ticket"}
            submitType="button"
          />
        </div>
      </Modal >

      {/* Delete Confirmation Modal */}
      < Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
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
          />
        </div>
      </Modal >
    </div >
  );
}
