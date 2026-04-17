"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import Modal from "@/components/admin/Modal";
import { Plus, Edit2, Trash2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { getTickets, createTicket, updateTicket, deleteTicket, Ticket } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface TicketsClientProps {
  event: EventSummary;
}

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
};

export default function TicketsClient({ event }: TicketsClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
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
      const data = await getTickets(event.id);
      setTickets(data);
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
      setFormData(initialTicketForm);
    } catch (error) {
      console.error("Failed to save ticket:", error);
    }
  };

  const handleDeleteClick = (ticketId: string) => {
    setDeleteTarget(ticketId);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTicket(event.id, deleteTarget);
      await loadTickets();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage="events" disableExpand={true} />

        <div className="ml-20 hidden lg:block h-full flex-shrink-0">
          <EventsSidebar event={event} />
        </div>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tickets & Admission
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Manage ticket types, pricing, and availability
                </p>
              </div>

              <button
                onClick={handleAddTicket}
                className="flex items-center gap-2 px-5 py-2 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm"
              >
                <Plus size={18} />
                Add Ticket
              </button>
            </div>

            {/* Tickets List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets created yet</p>
                <button
                  onClick={handleAddTicket}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3D518C] text-white rounded-lg text-sm font-medium hover:bg-[#2d3d6b] transition-all"
                >
                  <Plus size={16} />
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {tickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ticket.type === "paid"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              }`}
                          >
                            {ticket.type === "paid" ? `₱${ticket.price}` : "Free"}
                          </span>
                          {ticket.visibility === "hidden" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              <EyeOff size={12} />
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.max(0, ticket.quantity - ticket.usedQuantity)} / {ticket.quantity} available • {ticket.startDate} to {ticket.endDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="Edit ticket"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ticket.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="Delete ticket"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTicketId ? "Edit Ticket" : "Add New Ticket"}
        subtitle="Configure ticket details and pricing"
        size="lg"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveTicket(); }}>
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ticket Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Early Bird, VIP Pass"
                className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Ticket Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Ticket Type
              </label>
              <div className="flex gap-3">
                {(["paid", "free"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type })}
                    type="button"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${formData.type === type
                      ? "bg-[#3D518C] text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                  >
                    {type === "paid" ? "Paid" : "Free"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${errors.quantity ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]`}
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              {formData.type === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${errors.price ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]`}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${errors.startDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]`}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border ${errors.endDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]`}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Timezone Info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <AlertCircle size={14} />
              <span>Timezone is PHT, UTC + 8</span>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-[#3D518C] hover:text-[#2d3d6b] transition-colors"
            >
              {showAdvanced ? "▼" : "▶"} Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell attendees more about this ticket"
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] resize-none"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: formData.visibility === "visible" ? "hidden" : "visible" })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.visibility === "visible"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    {formData.visibility === "visible" ? "Visible" : "Hidden"}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-gray-100/80 dark:bg-gray-800 text-[#3D518C] dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-98 transition-all"
            >
              {editingTicketId ? "Update Ticket" : "Create Ticket"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Ticket"
        subtitle="This action cannot be undone"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this ticket? All associated data will be removed.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="px-6 py-2.5 bg-gray-100/80 dark:bg-gray-800 text-[#3D518C] dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-6 py-2.5 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-md hover:scale-[1.02] active:scale-98"
            >
              Delete Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
