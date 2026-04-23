"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, Eye, X, Package, AlertCircle, CheckCircle2, ShoppingBag, ChevronDown, Check, History, PackageOpen, Users } from "lucide-react";
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
const ADD_ON_NAME_MAX_LENGTH = 23;
const ADD_ON_DESCRIPTION_MAX_LENGTH = 256;
const VARIANT_LABEL_MAX_LENGTH = 30;
const VARIANT_STOCK_MAX = 1_000_000;
const VARIANT_LABEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .,'&()_/-]*$/;

export default function AddOnsTab({ event }: AddOnsTabProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isRedemptionLogOpen, setIsRedemptionLogOpen] = useState(false);
  const [modalView, setModalView] = useState<'redemptions' | 'reserved'>('redemptions');
  const [redemptionData, setRedemptionData] = useState<any[]>([]);
  const [reservedData, setReservedData] = useState<any[]>([]);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);
  const [isLoadingReserved, setIsLoadingReserved] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialAddOnForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingAddOn, setIsSavingAddOn] = useState(false);
  const [isDeletingAddOn, setIsDeletingAddOn] = useState(false);
  const [isApplyToOpen, setIsApplyToOpen] = useState(false);
  const applyToRef = useRef<HTMLDivElement>(null);

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

  const loadRedemptionData = async (addOnId: string) => {
    setIsLoadingRedemptions(true);
    try {
      const res = await fetch(`/api/events/${event.id}/addons/${addOnId}/redemptions`);
      if (!res.ok) {
        throw new Error(`Failed to load redemption data (${res.status})`);
      }
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setRedemptionData(json.data);
      } else {
        setRedemptionData([]);
      }
    } catch (error) {
      console.error("Failed to load redemption data:", error);
      setRedemptionData([]);
    } finally {
      setIsLoadingRedemptions(false);
    }
  };

  const loadReservedData = async (addOnId: string) => {
    setIsLoadingReserved(true);
    try {
      const res = await fetch(`/api/events/${event.id}/addons/${addOnId}/reserved`);
      if (!res.ok) {
        throw new Error(`Failed to load reserved data (${res.status})`);
      }
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setReservedData(json.data);
      } else {
        setReservedData([]);
      }
    } catch (error) {
      console.error("Failed to load reserved data:", error);
      setReservedData([]);
    } finally {
      setIsLoadingReserved(false);
    }
  };

  const validateVariantLabel = (rawLabel: string): string | null => {
    const label = rawLabel.trim();

    if (!label) {
      return "Variant label is required";
    }

    if (label.length > VARIANT_LABEL_MAX_LENGTH) {
      return `Variant label must be at most ${VARIANT_LABEL_MAX_LENGTH} characters`;
    }

    if (!VARIANT_LABEL_PATTERN.test(label)) {
      return "Variant label can only use letters, numbers, spaces, and . , ' & ( ) _ / -";
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const normalizedName = formData.name.trim();
    if (!normalizedName) {
      newErrors.name = "Add-on name is required";
    } else if (normalizedName.length > ADD_ON_NAME_MAX_LENGTH) {
      newErrors.name = `Add-on name must be at most ${ADD_ON_NAME_MAX_LENGTH} characters`;
    } else {
      const hasDuplicateName = addOns.some((addOn) =>
        addOn.id !== editingAddOnId
        && addOn.name.trim().toLowerCase() === normalizedName.toLowerCase()
      );
      if (hasDuplicateName) {
        newErrors.name = "Add-on name must be unique";
      }
    }

    const normalizedDescription = formData.description.trim();
    if (!normalizedDescription) {
      newErrors.description = "Description is required";
    } else if (normalizedDescription.length > ADD_ON_DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be at most ${ADD_ON_DESCRIPTION_MAX_LENGTH} characters`;
    }

    if (formData.hasVariants) {
      if (formData.variants.length === 0) {
        newErrors.variants = "At least one variant is required when variants are enabled";
      } else {
        const seenLabels = new Set<string>();
        for (const variant of formData.variants) {
          const labelError = validateVariantLabel(variant.label);
          if (labelError) {
            newErrors.variants = labelError;
            break;
          }

          const reservedRedeemed = (variant.stock_reserved || 0) + (variant.stock_redeemed || 0);
          if (!Number.isInteger(variant.stock) || variant.stock < reservedRedeemed || variant.stock > VARIANT_STOCK_MAX) {
            newErrors.variants = `Variant quantity must be between ${reservedRedeemed} (already reserved/redeemed) and ${VARIANT_STOCK_MAX.toLocaleString()}`;
            break;
          }

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
      // For non-variant addons, check if there are existing entitlements
      const currentAddOn = addOns.find(a => a.id === editingAddOnId);
      const reservedRedeemed = currentAddOn ? 
        (currentAddOn.variants?.reduce((sum, v) => sum + (v.stock_reserved || 0) + (v.stock_redeemed || 0), 0) || 0) : 0;
      
      if (!Number.isFinite(formData.stock) || formData.stock < reservedRedeemed) {
        newErrors.stock = `Stock must be at least ${reservedRedeemed} (already reserved/redeemed)`;
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
      appliedTo: addOn.appliedTo,
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
    return new Promise((resolve, reject) => {
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
        reject(new Error('Unable to process the selected image.'));
      };

      img.src = url;
    });
  };

  const ensureImageCanRender = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image file appears to be invalid or corrupted.'));
      };

      image.src = objectUrl;
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

    try {
      await ensureImageCanRender(file);
      const compressed = await compressImage(file);

      setFormData({ ...formData, imageFile: compressed });
      setImagePreview(URL.createObjectURL(compressed));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    } catch {
      setErrors((prev) => ({
        ...prev,
        image: 'Image file appears to be invalid or corrupted.',
      }));
    }
  };

  const handleAddVariant = () => {
    const parsedStock = Number.parseInt(newVariantStock, 10);

    const labelError = validateVariantLabel(newVariantLabel);
    if (labelError) {
      setErrors((prev) => ({ ...prev, variants: labelError }));
      return;
    }

    if (!newVariantStock.trim() || !Number.isFinite(parsedStock) || parsedStock <= 0 || parsedStock > VARIANT_STOCK_MAX) {
      setErrors((prev) => ({
        ...prev,
        variants: `Variant quantity must be between 1 and ${VARIANT_STOCK_MAX.toLocaleString()}`,
      }));
      return;
    }

    const normalizedNewLabel = newVariantLabel.trim().toLowerCase();
    const duplicateExists = formData.variants.some((variant) => variant.label.trim().toLowerCase() === normalizedNewLabel);
    if (duplicateExists) {
      setErrors((prev) => ({ ...prev, variants: "Variant labels must be unique" }));
      return;
    }

    const variantId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    setFormData({
      ...formData,
      variants: [...formData.variants, { 
        id: variantId, 
        label: newVariantLabel.trim(), 
        stock: parsedStock,
        stock_reserved: 0,
        stock_redeemed: 0,
      }],
    });
    setNewVariantLabel("");
    setNewVariantStock("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.variants;
      return next;
    });
  };

  const handleRemoveVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((v) => v.id !== id),
    });
  };

  const handleUpdateVariant = (id: string, field: 'label' | 'stock', value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== id) return variant;

        if (field === 'label') {
          return { ...variant, label: String(value).slice(0, VARIANT_LABEL_MAX_LENGTH) };
        }

        const parsedStock = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
        const nextStock = Number.isFinite(parsedStock) ? Math.min(parsedStock, VARIANT_STOCK_MAX) : 0;
        return { 
          ...variant, 
          stock: nextStock,
          stock_reserved: variant.stock_reserved || 0,
          stock_redeemed: variant.stock_redeemed || 0,
        };
      }),
    }));

    setErrors((prev) => {
      if (!prev.variants) return prev;
      const next = { ...prev };
      delete next.variants;
      return next;
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
              const totalReserved = addOn.hasVariants ? (addOn.variants?.reduce((s, v) => s + (v.stock_reserved || 0), 0) || 0) : 0;
              const totalRedeemed = addOn.hasVariants ? (addOn.variants?.reduce((s, v) => s + (v.stock_redeemed || 0), 0) || 0) : 0;
              const isLowStock = totalStock > 0 && totalStock <= 10;
              const isOutStock = totalStock <= 0;
              const needsUpdate = totalReserved + totalRedeemed > 0 && (addOn.hasVariants ? 
                addOn.variants?.some(v => v.stock < (v.stock_reserved || 0) + (v.stock_redeemed || 0)) : 
                addOn.stock < totalReserved + totalRedeemed);

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
                      {needsUpdate && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md bg-orange-500/90 text-white shadow-orange-200 dark:shadow-none">
                          <AlertCircle size={10} />
                          Needs Update
                        </div>
                      )}
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
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-semibold">
                          <PackageOpen size={12} />
                          <span>{totalStock}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedAddOn(addOn);
                            setModalView('reserved');
                            setIsRedemptionLogOpen(true);
                            loadReservedData(addOn.id);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                          title="View reserved users"
                        >
                          <Users size={12} />
                          <span>{totalReserved}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAddOn(addOn);
                            setModalView('redemptions');
                            setIsRedemptionLogOpen(true);
                            loadRedemptionData(addOn.id);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-[11px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                          title="View redemption log"
                        >
                          <History size={12} />
                          <span>{totalRedeemed}</span>
                        </button>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value.slice(0, ADD_ON_NAME_MAX_LENGTH) })}
              className={errors.name ? "border-red-500" : ""}
              maxLength={ADD_ON_NAME_MAX_LENGTH}
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Maximum {ADD_ON_NAME_MAX_LENGTH} characters.</p>
            {errors.name && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <ModalTextarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value.slice(0, ADD_ON_DESCRIPTION_MAX_LENGTH) })}
              rows={3}
              className={errors.description ? "border-red-500" : ""}
              maxLength={ADD_ON_DESCRIPTION_MAX_LENGTH}
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Maximum {ADD_ON_DESCRIPTION_MAX_LENGTH} characters.</p>
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
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
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
                {formData.variants.map((variant) => (
                  <div key={variant.id} className="flex gap-3 items-center bg-white dark:bg-gray-800 min-h-[42px] py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex-1 grid grid-cols-[1fr_100px] gap-2 items-center min-w-0">
                      <ModalInput
                        type="text"
                        value={variant.label}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateVariant(variant.id, 'label', e.target.value)}
                        placeholder="Label"
                        maxLength={VARIANT_LABEL_MAX_LENGTH}
                      />
                      <ModalInput
                        type="number"
                        min="1"
                        max={VARIANT_STOCK_MAX}
                        value={variant.stock.toString()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateVariant(variant.id, 'stock', e.target.value)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Qty"
                      />
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVariantLabel(e.target.value.slice(0, VARIANT_LABEL_MAX_LENGTH))}
                    placeholder="Label"
                    maxLength={VARIANT_LABEL_MAX_LENGTH}
                  />
                  <ModalInput
                    type="number"
                    min="1"
                    max={VARIANT_STOCK_MAX}
                    value={newVariantStock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVariantStock(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="Qty"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={
                    !newVariantLabel.trim()
                    || !newVariantStock.trim()
                    || Number.parseInt(newVariantStock, 10) <= 0
                    || Number.parseInt(newVariantStock, 10) > VARIANT_STOCK_MAX
                  }
                  className="w-[42px] h-[42px] flex items-center justify-center bg-[#5C6BC0] text-white rounded-[10px] hover:bg-[#3D518C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Plus size={20} />
                </button>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Label max {VARIANT_LABEL_MAX_LENGTH} chars; allowed: letters, numbers, spaces, and . , &apos; &amp; ( ) _ / -. Quantity: 1 to {VARIANT_STOCK_MAX.toLocaleString()}.
              </p>

              {errors.variants && <p className="text-red-600 text-[11px] leading-tight mt-1">{errors.variants}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Apply To</label>
            <div className="relative" ref={applyToRef}>
              <button
                type="button"
                onClick={() => setIsApplyToOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 py-2.5 px-3 min-h-[42px] border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-sm text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C]"
              >
                <span className="truncate">
                  {typeof formData.appliedTo === 'string'
                    ? 'All Tickets'
                    : tickets.find((t) => formData.appliedTo[0] === t.id)?.name ?? 'Select ticket'}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform duration-200 ${isApplyToOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isApplyToOpen && (
                <>
                  {/* click-outside overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsApplyToOpen(false)}
                  />
                  <div className="absolute z-20 mt-1.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                    {/* All Tickets option */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, appliedTo: 'all' });
                        setIsApplyToOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                        typeof formData.appliedTo === 'string'
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[#3D518C] dark:text-indigo-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <span>All Tickets</span>
                      {typeof formData.appliedTo === 'string' && (
                        <Check size={14} className="shrink-0 text-[#3D518C] dark:text-indigo-400" />
                      )}
                    </button>

                    {tickets.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        {tickets.map((ticket) => {
                          const isSelected = Array.isArray(formData.appliedTo) && formData.appliedTo[0] === ticket.id;
                          return (
                            <button
                              key={ticket.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, appliedTo: [ticket.id] });
                                setIsApplyToOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[#3D518C] dark:text-indigo-300 font-semibold'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                              }`}
                            >
                              <span className="truncate">{ticket.name}</span>
                              {isSelected && (
                                <Check size={14} className="shrink-0 text-[#3D518C] dark:text-indigo-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {typeof formData.appliedTo === 'string'
                ? `Applies to all current and future tickets for this event (${tickets.length} ticket type${tickets.length === 1 ? '' : 's'}).`
                : 'Applies only to the selected ticket type.'}
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
              <h4 className="font-medium text-sm mb-2">Stock Information</h4>
              {selectedAddOn.hasVariants && selectedAddOn.variants && selectedAddOn.variants.length > 0 ? (
                <ul className="space-y-2">
                  {selectedAddOn.variants.map((variant) => (
                    <li key={variant.id} className="text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{variant.label}</span>
                        <span className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 shadow-sm">
                          Available: {variant.stock}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-2">
                        <div>Reserved: {variant.stock_reserved || 0}</div>
                        <div>Redeemed: {variant.stock_redeemed || 0}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Standard Add-on</span>
                    <span className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 shadow-sm">
                      Available: {selectedAddOn.stock || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-2">
                    <div>Total Reserved: {selectedAddOn.variants?.reduce((sum, v) => sum + (v.stock_reserved || 0), 0) || 0}</div>
                    <div>Total Redeemed: {selectedAddOn.variants?.reduce((sum, v) => sum + (v.stock_redeemed || 0), 0) || 0}</div>
                  </div>
                </div>
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

      {/* Redemption/Reserved Log Modal */}
      <Modal
        isOpen={isRedemptionLogOpen}
        onClose={() => setIsRedemptionLogOpen(false)}
        title={modalView === 'redemptions' ? 'Add-on Redemption Log' : 'Reserved Users'}
      >
        {selectedAddOn && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedAddOn.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {modalView === 'redemptions' ? 'View who has claimed this add-on' : 'View users who have reserved but not claimed this add-on'}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalView('redemptions');
                  loadRedemptionData(selectedAddOn.id);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modalView === 'redemptions'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <History size={14} className="inline mr-2" />
                Redeemed
              </button>
              <button
                onClick={() => {
                  setModalView('reserved');
                  loadReservedData(selectedAddOn.id);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modalView === 'reserved'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Users size={14} className="inline mr-2" />
                Reserved
              </button>
            </div>
            
            {modalView === 'redemptions' ? (
              <>
                {isLoadingRedemptions ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
                  </div>
                ) : redemptionData.length === 0 ? (
                  <div className="text-center py-8">
                    <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No redemptions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {redemptionData.map((redemption) => (
                      <div key={redemption.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {redemption.userName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({redemption.userEmail})
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Variant: {redemption.variantLabel}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              Qty: {redemption.qty}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            {new Date(redemption.redeemedAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {redemption.station && (
                              <span>Station: {redemption.station}</span>
                            )}
                            {redemption.scannedBy && (
                              <span>• Scanned by: {redemption.scannedBy}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoadingReserved ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
                  </div>
                ) : reservedData.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No reserved users</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reservedData.map((user) => (
                      <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {user.userName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({user.userEmail})
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Variant: {user.variantLabel}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Qty: {user.qtyTotal}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            Reserved: {user.qtyReserved} | Redeemed: {user.qtyRedeemed}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Not yet claimed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setIsRedemptionLogOpen(false)}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-98 transition-all text-sm"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
