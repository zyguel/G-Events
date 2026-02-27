"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "@/components/admin/Modal";
import { getAddOns, createAddOn, updateAddOn, deleteAddOn, AddOn, AddOnVariant, getTickets, Ticket } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/types";

interface AddOnsTabProps {
  event: EventSummary;
}

const initialAddOnForm: Omit<AddOn, "id" | "createdAt"> = {
  name: "",
  description: "",
  image: "",
  appliedTo: "all",
  hasVariants: false,
  variants: [],
  stock: 0,
};

export default function AddOnsTab({ event }: AddOnsTabProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialAddOnForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (formData.hasVariants) {
      if (formData.variants.length === 0) {
        newErrors.variants = "At least one variant is required when variants are enabled";
      } else if (formData.variants.some((v) => !v.label.trim() || v.stock < 0)) {
        newErrors.variants = "All variants must have a valid label and stock >= 0";
      }
    } else {
      if (formData.stock < 0) {
        newErrors.stock = "Stock must be 0 or greater";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddOn = () => {
    setEditingAddOnId(null);
    setFormData(initialAddOnForm);
    setImagePreview(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditAddOn = (addOn: AddOn) => {
    setEditingAddOnId(addOn.id);
    setFormData({
      name: addOn.name,
      description: addOn.description,
      image: addOn.image,
      appliedTo: addOn.appliedTo,
      hasVariants: addOn.hasVariants || false,
      variants: addOn.variants || [],
      stock: addOn.stock || 0,
    });
    setImagePreview(addOn.image || null);
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

  const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      // Skip compression for small files (< 500KB) or non-raster formats
      if (file.size < 512_000 || !file.type.startsWith('image/')) {
        return resolve(file);
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Only resize if the image exceeds maxWidth on its longest side
        let { width, height } = img;
        if (width <= maxWidth && height <= maxWidth) {
          // Dimensions are fine — just re-encode at quality setting
        } else if (width >= height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Use WebP for better compression-to-quality ratio; fall back to JPEG
        const outputType = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const ext = outputType === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const compressed = new File([blob], `${baseName}${ext}`, { type: outputType });
            // Only use compressed version if it's actually smaller
            resolve(compressed.size < file.size ? compressed : file);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // Fall back to original on any error
      };

      img.src = url;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setFormData({ ...formData, imageFile: compressed });
      setImagePreview(URL.createObjectURL(compressed));
    }
  };

  const handleAddVariant = () => {
    if (!newVariantLabel.trim() || !newVariantStock.trim() || parseInt(newVariantStock) < 0) return;

    setFormData({
      ...formData,
      variants: [...formData.variants, { id: Date.now().toString(), label: newVariantLabel, stock: parseInt(newVariantStock) }],
    });
    setNewVariantLabel("");
    setNewVariantStock("");
  };

  const handleRemoveVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((v) => v.id !== id),
    });
  };

  const handleUpdateVariant = (id: string, field: 'label' | 'stock', value: string | number) => {
    const newVariants = formData.variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setFormData({ ...formData, variants: newVariants });
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
                  {addOn.hasVariants && addOn.variants ? (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{addOn.variants.length} Variant{addOn.variants.length !== 1 ? 's' : ''}</p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Standard Add-on (Stock: {addOn.stock || 0})</p>
                  )}
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
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-[#3D518C] file:text-white hover:file:bg-indigo-700 border border-gray-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]/20 transition-all cursor-pointer"
            />
            {formData.image && (
              <div className="mt-3">
                <img src={imagePreview || formData.image} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              </div>
            )}
            {!formData.image && imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Add-on Name *</label>
            <ModalInput
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <ModalTextarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.description}</p>}
          </div>

          <div className="flex items-center gap-4 py-2">
            <span className="text-sm font-medium">Has variants?</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasVariants: true, variants: formData.variants || [] })}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${formData.hasVariants ? 'bg-white dark:bg-gray-700 shadow text-[#3D518C] dark:text-indigo-300 font-semibold cursor-default' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasVariants: false })}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${!formData.hasVariants ? 'bg-white dark:bg-gray-700 shadow text-[#3D518C] dark:text-indigo-300 font-semibold cursor-default' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                No
              </button>
            </div>
          </div>

          {!formData.hasVariants && (
            <div>
              <label className="block text-sm font-medium mb-2">Stock/Quantity *</label>
              <ModalInput
                type="number"
                min="0"
                value={formData.stock.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className={errors.stock ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.stock}</p>}
            </div>
          )}

          {formData.hasVariants && (
            <div className="bg-slate-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
              <label className="text-sm font-medium">Variants *</label>

              <div className="space-y-3">

                {formData.variants.filter(v => v.label.trim()).map((variant) => (
                  <div key={variant.id} className="flex gap-3 items-center bg-white dark:bg-gray-800 min-h-[42px] py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex-1 pl-1 text-gray-900 dark:text-gray-100 min-w-0 pr-2">
                      <span className="text-sm font-medium break-words leading-tight">
                        {variant.label}
                        <span className="text-gray-400 mx-2 font-light">|</span>
                        <span className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400">QTY: </span>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{variant.stock}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variant.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Remove variant"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Variant Row */}
              <div className="flex gap-2 items-center mt-4">
                <div className="flex-1 grid grid-cols-[1fr_100px] gap-2">
                  <ModalInput
                    type="text"
                    value={newVariantLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVariantLabel(e.target.value)}
                    placeholder="Label"
                  />
                  <ModalInput
                    type="number"
                    min="0"
                    value={newVariantStock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVariantStock(e.target.value)}
                    placeholder="Stock"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={!newVariantLabel.trim() || !newVariantStock.trim()}
                  className="w-[42px] h-[42px] flex items-center justify-center bg-[#5C6BC0] text-white rounded-[10px] hover:bg-[#3D518C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Plus size={20} />
                </button>
              </div>

              {errors.variants && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.variants}</p>}
            </div>
          )}

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

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => setIsModalOpen(false)}
            onSave={handleSaveAddOn}
            saveText={editingAddOnId ? "Update Add-on" : "Create Add-on"}
            submitType="button"
          />
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
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{selectedAddOn.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Variants</h4>
              {selectedAddOn.hasVariants && selectedAddOn.variants && selectedAddOn.variants.length > 0 ? (
                <ul className="space-y-2">
                  {selectedAddOn.variants.map((variant) => (
                    <li key={variant.id} className="text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="font-medium">{variant.label}</span>
                      <span className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 shadow-sm">Stock: {variant.stock}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Standard Add-on (Stock: {selectedAddOn.stock || 0})</p>
              )}
            </div>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-98 transition-all text-sm"
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
