"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "@/components/admin/Modal";
import DateInput from "@/components/admin/DateInput";
import TimeInput from "@/components/admin/TimeInput";
import TablePaginationControls from "@/components/admin/TablePaginationControls";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, PromoCode, getTickets, Ticket } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/types";

interface PromoCodesTabProps {
  event: EventSummary;
}

const DATE_PART_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PART_PATTERN = /^\d{2}:\d{2}$/;

const formatDatePart = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDatePartFromValue = (value: string): string | null => {
  const datePart = value.split("T")[0] ?? "";
  return DATE_PART_PATTERN.test(datePart) ? datePart : null;
};

const getTimePartFromValue = (value: string): string => {
  const timePart = value.includes("T") ? value.split("T")[1] ?? "" : "";
  const normalizedTime = timePart.slice(0, 5);
  return TIME_PART_PATTERN.test(normalizedTime) ? normalizedTime : "";
};

const initialPromoForm: Omit<PromoCode, "id" | "createdAt"> = {
  code: "",
  type: "promo_code",
  valueType: "percentage",
  value: 0,
  startDate: "",
  endDate: "",
  appliedTo: "all",
  usageLimit: 0,
  usageCount: 0,
  status: "active",
};

export default function PromoCodesTab({ event }: PromoCodesTabProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialPromoForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "promo_code" | "discount">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const updateDateField = (field: "startDate" | "endDate", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoCodesData, ticketsData] = await Promise.all([getPromoCodes(event.id), getTickets(event.id)]);
      setPromoCodes(promoCodesData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = "Promo code is required";
    if (formData.value <= 0) newErrors.value = "Value must be greater than 0";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPromo = () => {
    setEditingPromoId(null);
    setFormData(initialPromoForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromoId(promo.id);
    setFormData({
      code: promo.code,
      type: promo.type,
      valueType: promo.valueType,
      value: promo.value,
      startDate: promo.startDate,
      endDate: promo.endDate,
      appliedTo: promo.appliedTo,
      usageLimit: promo.usageLimit,
      usageCount: promo.usageCount,
      status: promo.status,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSavePromo = async () => {
    if (!validateForm()) return;

    try {
      if (editingPromoId) {
        await updatePromoCode(event.id, editingPromoId, formData);
      } else {
        await createPromoCode(event.id, formData);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save promo code:", error);
    }
  };

  const handleDeleteClick = (promoId: string) => {
    setDeleteTarget(promoId);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deletePromoCode(event.id, deleteTarget);
      await loadData();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete promo code:", error);
    }
  };

  const filteredPromoCodes = promoCodes.filter((promo) => {
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || promo.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const paginatedPromoCodes = filteredPromoCodes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPromoCodes.length / rowsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredPromoCodes.length, currentPage, rowsPerPage]);

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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Event Promotions</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Offer discounts and promo codes for your event.</p>
        </div>
        <button
          onClick={handleAddPromo}
          className="px-5 py-2.5 text-sm bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-white font-bold rounded-xl flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} />
          Create Promotion
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-4 py-2.5 text-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300"
            >
              <Filter size={18} />
              {filterType === 'all' ? 'All Types' : filterType === 'promo_code' ? 'Promo Code' : 'Discount'}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {["all", "promo_code", "discount"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type as "all" | "promo_code" | "discount");
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${filterType === type ? "bg-indigo-50 dark:bg-indigo-900/20 text-[#3D518C] dark:text-indigo-300 font-bold" : "text-gray-600 dark:text-gray-300"
                      }`}
                  >
                    {type === "all" ? "All Types" : type === "promo_code" ? "Promo Code" : "Discount"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
        {filteredPromoCodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No promo codes found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Code Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Uses / Limit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {paginatedPromoCodes.map((promo) => (
                    <motion.tr
                      key={promo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{promo.code}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${promo.type === "promo_code"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          }`}>
                          {promo.type === "promo_code" ? "Promo Code" : "Discount"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {promo.valueType === "percentage" ? `${promo.value}%` : `₱${promo.value.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {promo.usageCount}/{promo.usageLimit}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${promo.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {promo.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditPromo(promo)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(promo.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            <TablePaginationControls
              totalItems={filteredPromoCodes.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPromoId ? "Edit Promo Code" : "Add Promo Code"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Promo Code *</label>
            <ModalInput
              type="text"
              placeholder="e.g. EARLYBIRD2024"
              value={formData.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className={`uppercase ${errors.code ? "border-red-500" : ""}`}
            />
            {errors.code && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Value Type</label>
              <div className="flex gap-2">
                {["percentage", "fixed"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, valueType: type as "percentage" | "fixed" })}
                    className={`flex-1 py-2.5 px-3 min-h-[42px] rounded-xl font-medium transition-all shadow-sm text-sm ${formData.valueType === type
                      ? "bg-[#3D518C] text-white ring-2 ring-[#3D518C] ring-offset-2 dark:ring-offset-gray-800"
                      : "bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    {type === "percentage" ? "%" : "₱"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Value *</label>
              <div className="relative">
                {formData.valueType === "fixed" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium z-10">
                    ₱
                  </span>
                )}
                <ModalInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formData.value || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className={`${formData.valueType === "fixed" ? "pl-8 pr-3" : formData.valueType === "percentage" ? "pl-3 pr-8" : "px-3"} ${errors.value ? "border-red-500" : ""}`}
                />
                {formData.valueType === "percentage" && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    %
                  </span>
                )}
              </div>
              {errors.value && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.value}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date & Time *</label>
              <div className="flex gap-2">
                <div className="w-[55%]">
                  <DateInput
                    value={formData.startDate ? new Date(formData.startDate.split('T')[0]) : null}
                    onChange={(date) => {
                      if (!date) {
                        updateDateField("startDate", "");
                        return;
                      }
                      const dateStr = formatDatePart(date);
                      const timeStr = getTimePartFromValue(formData.startDate);
                      const nextValue = timeStr ? `${dateStr}T${timeStr}` : dateStr;
                      updateDateField("startDate", nextValue);
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
                      updateDateField("startDate", time ? `${datePart}T${time}` : datePart);
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
                        updateDateField("endDate", "");
                        return;
                      }
                      const dateStr = formatDatePart(date);
                      const timeStr = getTimePartFromValue(formData.endDate);
                      const nextValue = timeStr ? `${dateStr}T${timeStr}` : dateStr;
                      updateDateField("endDate", nextValue);
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
                      updateDateField("endDate", time ? `${datePart}T${time}` : datePart);
                    }}
                    placeholder="Time"
                    className={errors.endDate ? "border-red-500 text-sm" : "text-sm"}
                  />
                </div>
              </div>
              {errors.endDate && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apply To</label>
            <select
              value={typeof formData.appliedTo === 'string' ? formData.appliedTo : formData.appliedTo[0] || 'all'}
              onChange={(e) => setFormData({ ...formData, appliedTo: e.target.value === 'all' ? 'all' : [e.target.value] })}
              className="w-full pl-3 pr-10 py-2.5 min-h-[42px] border rounded-xl bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 border-gray-200 dark:border-gray-700 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat"
            >
              <option value="all">All Tickets</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Usage Limit</label>
            <ModalInput
              type="number"
              min="0"
              placeholder="0"
              value={formData.usageLimit === 0 ? "" : formData.usageLimit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.status === "active"}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "active" : "inactive" })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => setIsModalOpen(false)}
            onSave={handleSavePromo}
            saveText={editingPromoId ? "Update Promo" : "Create Promo"}
            submitType="button"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Promo Code"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this promo code?</p>
          <ModalFooter
            onCancel={() => setIsConfirmDeleteOpen(false)}
            onSave={handleConfirmDelete}
            saveText="Delete"
            submitType="button"
            isDanger={true}
          />
        </div>
      </Modal>
    </div>
  );
}
