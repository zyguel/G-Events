"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
    initialUrl?: string;
}

export function LinkModal({ isOpen, onClose, onSubmit, initialUrl = "" }: LinkModalProps) {
    const [url, setUrl] = useState(initialUrl);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(url);
        setUrl("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Insert Link</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL
                    </label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                        autoFocus
                    />
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            Insert Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void | Promise<void>;
    onUploadImage?: (file: File) => Promise<string>;
}

export function ImageModal({ isOpen, onClose, onSubmit, onUploadImage }: ImageModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = imageUrl.trim();

        if (!trimmedUrl && !file) {
            return;
        }

        try {
            setIsSubmitting(true);

            if (trimmedUrl) {
                await onSubmit(trimmedUrl);
                handleClose();
                return;
            }

            if (file && onUploadImage) {
                const uploadedUrl = await onUploadImage(file);
                await onSubmit(uploadedUrl);
                handleClose();
                return;
            }

            if (preview) {
                await onSubmit(preview);
                handleClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview("");
        setImageUrl("");
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Insert Image</h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Image URL
                    </label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                    />

                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">or upload an image file</div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
                    />
                    {preview && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                            <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
                        </div>
                    )}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!file && !imageUrl.trim())}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Inserting...' : 'Insert Image'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

