"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/admin/Modal";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, PromoCode, getTickets, Ticket } from "@/lib/eventManagement";

interface PromoCodesTabProps {
  event: {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
  };
}

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
  const [addPromoTypeOpen, setAddPromoTypeOpen] = useState(false);

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

  const handleAddPromo = (type: "promo_code" | "discount") => {
    setEditingPromoId(null);
    setFormData({ ...initialPromoForm, type });
    setErrors({});
    setAddPromoTypeOpen(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Promo Codes & Discounts</h2>

        {/* Search and Filter */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Filter size={18} />
              Type
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                {["all", "promo_code", "discount"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type as "all" | "promo_code" | "discount");
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      filterType === type ? "bg-blue-50 dark:bg-blue-900/20 text-[#3D518C] font-medium" : ""
                    }`}
                  >
                    {type === "all" ? "All Types" : type === "promo_code" ? "Promo Code" : "Discount"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Promotion Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddPromoTypeOpen(!addPromoTypeOpen)}
              className="px-4 py-2 bg-[#3D518C] text-white rounded-lg font-medium hover:bg-[#2a3a5e] transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Promotion
            </button>

            {addPromoTypeOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => handleAddPromo("promo_code")}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Promo Code
                </button>
                <button
                  onClick={() => handleAddPromo("discount")}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium border-t border-gray-300 dark:border-gray-600"
                >
                  Discount
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {filteredPromoCodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No promo codes found</p>
          </div>
        ) : (
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
                {filteredPromoCodes.map((promo) => (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{promo.code}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        promo.type === "promo_code"
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
                      {promo.usageCount}/{promo.usageLimit > 0 ? promo.usageLimit : "∞"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          promo.status === "active"
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
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 uppercase ${
                errors.code ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Value Type</label>
              <div className="flex gap-2">
                {["percentage", "fixed"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, valueType: type as "percentage" | "fixed" })}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                      formData.valueType === type
                        ? "bg-[#3D518C] text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {type === "percentage" ? "%" : "₱"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Value *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${
                  errors.value ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.value && <p className="text-red-600 text-sm mt-1">{errors.value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${
                  errors.startDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${
                  errors.endDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apply To</label>
            <select
              value={typeof formData.appliedTo === 'string' ? formData.appliedTo : formData.appliedTo[0] || 'all'}
              onChange={(e) => setFormData({ ...formData, appliedTo: e.target.value as 'all' | string })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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
            <label className="block text-sm font-medium mb-2">Usage Limit (0 = unlimited)</label>
            <input
              type="number"
              min="0"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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
          <div className="flex gap-3 justify-end border-t border-gray-300 dark:border-gray-600 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePromo}
              className="px-4 py-2 bg-[#3D518C] text-white rounded-lg hover:bg-[#2a3a5e] transition-colors font-medium"
            >
              {editingPromoId ? "Update" : "Create"} Promo
            </button>
          </div>
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
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
