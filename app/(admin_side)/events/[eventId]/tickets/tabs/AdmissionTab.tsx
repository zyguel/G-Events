"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/admin/Modal";
import DateInput from "@/components/admin/DateInput";
import TimeInput from "@/components/admin/TimeInput";
import { getTickets, createTicket, updateTicket, deleteTicket, Ticket } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/types";

interface AdmissionTabProps {
  event: EventSummary;
}

const initialTicketForm: Omit<Ticket, "id" | "createdAt"> = {
  name: "",
  type: "paid",
  quantity: 0,
  price: 0,
  currency: "PHP",
  startDate: "",
  endDate: "",
  timezone: "Asia/Manila",
  description: "",
  visibility: "visible",
  minQuantity: 1,
  maxQuantity: 1,
};

export default function AdmissionTab({ event }: AdmissionTabProps) {
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
          className="px-4 py-2 text-sm bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.05] transition-all duration-200 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Ticket
        </button>
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
                    <h3 className="font-semibold text-lg">{ticket.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.type === "paid" ? `$${ticket.price} ${ticket.currency}` : "Free"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity: {ticket.quantity} | Min: {ticket.minQuantity} | Max: {ticket.maxQuantity}
                    </p>
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
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                }`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <div className="flex gap-3">
                {["paid", "free"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type: type as "paid" | "free" })}
                    className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all shadow-sm ${formData.type === type
                      ? "bg-[#3D518C] text-white ring-2 ring-[#3D518C] ring-offset-2 dark:ring-offset-gray-800"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    {type === "paid" ? "Paid" : "Free"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 ${errors.quantity ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {formData.type === "paid" && (
            <div>
              <label className="block text-sm font-medium mb-2">Price *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 ${errors.price ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
              />
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
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
                    className={errors.startDate ? "border-red-500" : ""}
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
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                </div>
              </div>
              {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
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
                    className={errors.endDate ? "border-red-500" : ""}
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
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                </div>
              </div>
              {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
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
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
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
                  <input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Quantity per Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
                    className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 ${errors.maxQuantity ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                      }`}
                  />
                  {errors.maxQuantity && <p className="text-red-600 text-sm mt-1">{errors.maxQuantity}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex gap-3 justify-end border-t border-gray-300 dark:border-gray-600 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-gray-100/80 dark:bg-gray-800 text-[#3D518C] dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTicket}
              className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-98 transition-all"
            >
              {editingTicketId ? "Update" : "Create"} Ticket
            </button>
          </div>
        </div>
      </Modal >

      {/* Delete Confirmation Modal */}
      < Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)
        }
        title="Delete Ticket"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this ticket?</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="px-6 py-2.5 bg-gray-100/80 dark:bg-gray-800 text-[#3D518C] dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-6 py-2.5 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-md hover:scale-[1.02] active:scale-98"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal >
    </div >
  );
}
