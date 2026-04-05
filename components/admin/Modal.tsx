"use client";

import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    bodyClassName?: string;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, size = "md", bodyClassName }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    }[size];

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${sizeClasses} max-h-[90vh] flex flex-col transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden font-sans`}
            >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r from-[#3D518C] to-indigo-600 ${size === 'sm' ? 'px-6 py-4' : 'px-8 py-6'} rounded-t-2xl`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h2 className={`${size === 'sm' ? 'text-lg' : 'text-xl'} font-bold text-white`}>
                                {title}
                            </h2>
                            {subtitle && (
                                <p className={`text-indigo-200 ${size === 'sm' ? 'text-xs' : 'text-sm'} mt-1`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 transition-colors rounded-lg p-2 flex-shrink-0"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-y-auto bg-white dark:bg-gray-800 ${bodyClassName ? bodyClassName : (size === 'sm' ? 'p-6' : 'p-6 md:p-8')}`}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

// --- Reusable Modal Form Components ---

interface ModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export const ModalInput = React.forwardRef<HTMLInputElement, ModalInputProps>(
    ({ className = "", icon, ...props }, ref) => {
        return (
            <div className="relative">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm font-sans text-sm ${icon ? 'pl-10' : ''} ${className}`}
                    {...props}
                />
            </div>
        );
    }
);
ModalInput.displayName = "ModalInput";

export const ModalTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className = "", ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none resize-none transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm font-sans text-sm ${className}`}
                {...props}
            />
        );
    }
);
ModalTextarea.displayName = "ModalTextarea";

interface ModalFooterProps {
    onCancel: () => void;
    cancelText?: string;
    onSave?: () => void;
    saveText?: string;
    isSubmitting?: boolean;
    submitType?: "button" | "submit";
    isDanger?: boolean;
    disableSave?: boolean;
}

export function ModalFooter({
    onCancel,
    cancelText = "Cancel",
    onSave,
    saveText = "Save Changes",
    isSubmitting = false,
    submitType = "submit",
    isDanger = false,
    disableSave = false,
}: ModalFooterProps) {
    return (
        <div className="flex justify-end gap-3 pt-4 pb-6 border-t border-gray-100 dark:border-gray-700 mt-6 px-6 md:px-8">
            <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors font-sans disabled:opacity-50"
            >
                {cancelText}
            </button>
            <button
                type={submitType}
                onClick={submitType === 'button' ? onSave : undefined}
                disabled={isSubmitting || disableSave}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all font-sans flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDanger ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5' : 'bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5'}`}
            >
                {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    saveText
                )}
            </button>
        </div>
    );
}
