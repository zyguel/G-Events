"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, X, Package, AlertCircle, CheckCircle2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "@/components/admin/Modal";
import { getAddOns, createAddOn, updateAddOn, deleteAddOn, AddOn, getTickets, Ticket } from "@/lib/eventManagement";
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
  stock: 1,
};

const ADD_ON_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];
const ADD_ON_ALLOWED_IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/svg+xml";
const ADD_ON_MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const ADD_ON_ALLOWED_IMAGE_LABEL = "JPEG, PNG, WebP, GIF, AVIF, SVG";

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
  const [isSavingAddOn, setIsSavingAddOn] = useState(false);
  const [isDeletingAddOn, setIsDeletingAddOn] = useState(false);

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
    const normalizedName = formData.name.trim().toLowerCase();
    if (normalizedName) {
      const hasDuplicateName = addOns.some((addOn) =>
        addOn.id !== editingAddOnId
        && addOn.name.trim().toLowerCase() === normalizedName
      );
      if (hasDuplicateName) {
        newErrors.name = "Add-on name must be unique";
      }
    }
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (formData.hasVariants) {
      if (formData.variants.length === 0) {
        newErrors.variants = "At least one variant is required when variants are enabled";
      } else if (formData.variants.some((v) => !v.label.trim() || !Number.isFinite(v.stock) || v.stock <= 0)) {
        newErrors.variants = "All variants must have a valid label and stock greater than 0";
      } else {
        const seenLabels = new Set<string>();
        for (const variant of formData.variants) {
          const normalizedLabel = variant.label.trim().toLowerCase();
          if (!normalizedLabel) continue;
          if (seenLabels.has(normalizedLabel)) {
            newErrors.variants = "Variant labels must be unique";
            break;
          }
          seenLabels.add(normalizedLabel);
        }
      }
    } else {
      if (!Number.isFinite(formData.stock) || formData.stock <= 0) {
        newErrors.stock = "Stock must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddOn = () => {
    setEditingAddOnId(null);
    setFormData({ ...initialAddOnForm, appliedTo: "all" });
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
      appliedTo: "all",
      hasVariants: addOn.hasVariants || false,
      variants: addOn.hasVariants ? (addOn.variants || []) : [],
      stock: addOn.stock || 0,
    });
    setImagePreview(addOn.image || null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSaveAddOn = async () => {
    if (isSavingAddOn) return;
    if (!validateForm()) return;

    try {
      setIsSavingAddOn(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.form;
        return next;
      });

      const payload: Omit<AddOn, "id" | "createdAt"> = {
        ...formData,
        appliedTo: "all",
        variants: formData.hasVariants ? formData.variants : [],
        stock: formData.hasVariants ? 0 : formData.stock,
      };

      if (editingAddOnId) {
        await updateAddOn(event.id, editingAddOnId, payload);
      } else {
        await createAddOn(event.id, payload);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save add-on:", error);
      setErrors((prev) => ({
        ...prev,
        form: error instanceof Error ? error.message : "Failed to save add-on",
      }));
    } finally {
      setIsSavingAddOn(false);
    }
  };

  const handleDeleteClick = (addOnId: string) => {
    setDeleteTarget(addOnId);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeletingAddOn) return;

    try {
      setIsDeletingAddOn(true);
      await deleteAddOn(event.id, deleteTarget);
      await loadData();
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete add-on:", error);
    } finally {
      setIsDeletingAddOn(false);
    }
  };

  const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      // Skip compression for small files (< 500KB) or non-raster formats
      if (file.size < 512_000 || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
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
    if (!file) return;

    if (!ADD_ON_ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: `Unsupported format. Allowed: ${ADD_ON_ALLOWED_IMAGE_LABEL}`,
      }));
      e.target.value = "";
      return;
    }

    if (file.size > ADD_ON_MAX_IMAGE_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        image: "Image is too large. Maximum size is 20MB.",
      }));
      e.target.value = "";
      return;
    }

    const compressed = await compressImage(file);
    setFormData({ ...formData, imageFile: compressed });
    setImagePreview(URL.createObjectURL(compressed));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  };

  const handleAddVariant = () => {
    const parsedStock = Number.parseInt(newVariantStock, 10);
    if (!newVariantLabel.trim() || !newVariantStock.trim() || !Number.isFinite(parsedStock) || parsedStock <= 0) return;

    const variantId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    setFormData({
      ...formData,
      variants: [...formData.variants, { id: variantId, label: newVariantLabel, stock: parsedStock }],
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Event Add-ons</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manage merchandise, rentals, and other extra items.</p>
        </div>
        <button
          onClick={handleAddAddOn}
          disabled={isSavingAddOn || isDeletingAddOn}
          className="px-5 py-2.5 text-sm bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-white font-bold rounded-xl flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} />
          Create Add-on
        </button>
      </div>

      {/* Grid View */}
      {addOns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <Package size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-900 dark:text-white font-bold">No add-ons created yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6 text-center max-w-xs">Start by creating your first add-on to offer extra value to your attendees.</p>
          <button
            onClick={handleAddAddOn}
            disabled={isSavingAddOn || isDeletingAddOn}
            className="px-6 py-2.5 text-sm border font-bold text-[#3D518C] dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
          >
            Add New Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {addOns.map((addOn) => {
              const totalStock = addOn.hasVariants ? (addOn.variants?.reduce((s, v) => s + v.stock, 0) || 0) : (addOn.stock || 0);
              const isLowStock = totalStock > 0 && totalStock <= 10;
              const isOutStock = totalStock <= 0;

              return (
                <motion.div
                  key={addOn.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-gray-900 font-sans">
                    {addOn.image ? (
                      <img
                        src={addOn.image}
                        alt={addOn.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={48} className="text-gray-300 dark:text-gray-700" />
                      </div>
                    )}

                    {/* Stock Badge Overlay */}
                    <div className="absolute top-4 left-4">
                      <div className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md
                        ${isOutStock
                          ? 'bg-red-500/90 text-white shadow-red-200 dark:shadow-none'
                          : isLowStock
                            ? 'bg-amber-500/90 text-white shadow-amber-200 dark:shadow-none'
                            : 'bg-emerald-500/90 text-white shadow-emerald-200 dark:shadow-none'
                        }
                      `}>
                        {isOutStock ? <AlertCircle size={10} /> : isLowStock ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                        {isOutStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 font-sans">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-[#3D518C] dark:group-hover:text-indigo-400 transition-colors">
                        {addOn.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {addOn.hasVariants ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <Package size={10} />
                          {addOn.variants?.length || 0} Variants
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Standard Item
                        </div>
                      )}
                      <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                        TOTAL QTY: {totalStock}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px] leading-relaxed">
                      {addOn.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-5">
                      <button
                        onClick={() => {
                          setSelectedAddOn(addOn);
                          setIsDetailsModalOpen(true);
                        }}
                        className="flex-1 min-h-[44px] px-4 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye size={16} />
                        Details
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditAddOn(addOn)}
                          disabled={isSavingAddOn || isDeletingAddOn}
                          className="w-11 h-11 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(addOn.id)}
                          disabled={isSavingAddOn || isDeletingAddOn}
                          className="w-11 h-11 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (isSavingAddOn) return;
          setIsModalOpen(false);
        }}
        title={editingAddOnId ? "Edit Add-on" : "Create Add-on"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Add-on Image</label>
            <input
              type="file"
              accept={ADD_ON_ALLOWED_IMAGE_ACCEPT}
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-[#3D518C] file:text-white hover:file:bg-indigo-700 border border-gray-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]/20 transition-all cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: {ADD_ON_ALLOWED_IMAGE_LABEL}. Maximum file size: 20MB.
            </p>
            {errors.image && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.image}</p>}
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
                onClick={() => setFormData({ ...formData, hasVariants: false, variants: [] })}
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
                min="1"
                value={formData.stock.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  setFormData({ ...formData, stock: Number.isFinite(parsed) ? parsed : 0 });
                }}
                className={errors.stock ? "border-red-500" : ""}
                placeholder="1"
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
                    min="1"
                    value={newVariantStock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVariantStock(e.target.value)}
                    placeholder="Qty"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={!newVariantLabel.trim() || !newVariantStock.trim() || Number.parseInt(newVariantStock, 10) <= 0}
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
            <div className="w-full py-2.5 px-3 min-h-[42px] border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-medium">
              All Tickets
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Applies to all current and future tickets for this event ({tickets.length} ticket type{tickets.length === 1 ? '' : 's'}).
            </p>
          </div>

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => setIsModalOpen(false)}
            onSave={handleSaveAddOn}
            saveText={editingAddOnId ? "Update Add-on" : "Create Add-on"}
            submitType="button"
            isSubmitting={isSavingAddOn}
          />
          {errors.form && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.form}</p>
          )}
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
        onClose={() => {
          if (isDeletingAddOn) return;
          setIsConfirmDeleteOpen(false);
        }}
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
            isSubmitting={isDeletingAddOn}
          />
        </div>
      </Modal>
    </div>
  );
}
