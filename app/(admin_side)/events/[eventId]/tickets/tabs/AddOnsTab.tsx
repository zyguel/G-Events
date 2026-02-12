"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/admin/Modal";
import { getAddOns, createAddOn, updateAddOn, deleteAddOn, AddOn, getTickets, Ticket } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/api";

interface AddOnsTabProps {
  event: EventSummary;
}

const initialAddOnForm: Omit<AddOn, "id" | "createdAt"> = {
  name: "",
  type: "",
  description: "",
  image: "",
  appliedTo: "all",
  inclusions: [""],
};

export default function AddOnsTab({ event }: AddOnsTabProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialAddOnForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [addOnsData, ticketsData] = await Promise.all([getAddOns(event.id), getTickets(event.id)]);
      setAddOns(addOnsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Add-on name is required";
    if (!formData.type.trim()) newErrors.type = "Add-on type is required";
    if (formData.inclusions.length === 0 || formData.inclusions.every((i) => !i.trim())) {
      newErrors.inclusions = "At least one inclusion is required";
    }
    if (!formData.description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddOn = () => {
    setEditingAddOnId(null);
    setFormData(initialAddOnForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditAddOn = (addOn: AddOn) => {
    setEditingAddOnId(addOn.id);
    setFormData({
      name: addOn.name,
      type: addOn.type,
      description: addOn.description,
      image: addOn.image,
      appliedTo: addOn.appliedTo,
      inclusions: addOn.inclusions,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSaveAddOn = async () => {
    if (!validateForm()) return;

    try {
      if (editingAddOnId) {
        await updateAddOn(event.id, editingAddOnId, formData);
      } else {
        await createAddOn(event.id, formData);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save add-on:", error);
    }
  };

  const handleDeleteClick = (addOnId: string) => {
    setDeleteTarget(addOnId);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAddOn(event.id, deleteTarget);
      await loadData();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete add-on:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInclusion = () => {
    setFormData({
      ...formData,
      inclusions: [...formData.inclusions, ""],
    });
  };

  const handleRemoveInclusion = (index: number) => {
    setFormData({
      ...formData,
      inclusions: formData.inclusions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateInclusion = (index: number, value: string) => {
    const newInclusions = [...formData.inclusions];
    newInclusions[index] = value;
    setFormData({ ...formData, inclusions: newInclusions });
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
          onClick={handleAddAddOn}
          className="px-4 py-2 text-sm bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.05] transition-all duration-200 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Create Add-on
        </button>
      </div>

      {/* Grid View */}
      {addOns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No add-ons created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {addOns.map((addOn) => (
              <motion.div
                key={addOn.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                {addOn.image && (
                  <img src={addOn.image} alt={addOn.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{addOn.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{addOn.type}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{addOn.description}</p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAddOn(addOn);
                        setIsDetailsModalOpen(true);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditAddOn(addOn)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(addOn.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddOnId ? "Edit Add-on" : "Create Add-on"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Add-on Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            {formData.image && (
              <div className="mt-3">
                <img src={formData.image} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Add-on Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type (e.g., VIP Package, Workshop) *</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${errors.type ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
            />
            {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 ${errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apply To</label>
            <select
              value={typeof formData.appliedTo === 'string' ? formData.appliedTo : formData.appliedTo[0] || 'all'}
              onChange={(e) => setFormData({ ...formData, appliedTo: e.target.value === 'all' ? 'all' : [e.target.value] })}
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
            <label className="block text-sm font-medium mb-3">Inclusions *</label>
            <div className="space-y-2">
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={inclusion}
                    onChange={(e) => handleUpdateInclusion(index, e.target.value)}
                    placeholder="e.g., Lunch, T-shirt, etc."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <button
                    onClick={() => handleRemoveInclusion(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {errors.inclusions && <p className="text-red-600 text-sm mt-1">{errors.inclusions}</p>}
            <button
              onClick={handleAddInclusion}
              className="mt-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              + Add Inclusion
            </button>
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
              onClick={handleSaveAddOn}
              className="px-4 py-2 bg-[#3D518C] text-white rounded-lg hover:bg-[#2a3a5e] transition-colors font-medium"
            >
              {editingAddOnId ? "Update" : "Create"} Add-on
            </button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Add-on Details"
      >
        {selectedAddOn && (
          <div className="space-y-4">
            {selectedAddOn.image && (
              <img src={selectedAddOn.image} alt={selectedAddOn.name} className="w-full h-48 object-cover rounded-lg" />
            )}
            <div>
              <h3 className="font-semibold text-lg">{selectedAddOn.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAddOn.type}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedAddOn.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Inclusions</h4>
              <ul className="space-y-1">
                {selectedAddOn.inclusions.map((inclusion, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#3D518C] rounded-full"></span>
                    {inclusion}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="w-full px-4 py-2 bg-[#3D518C] text-white rounded-lg hover:bg-[#2a3a5e] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Add-on"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this add-on?</p>
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
