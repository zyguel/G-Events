"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, subtitle, children, size = "md" }: ModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
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
                <div className={`flex-1 overflow-y-scroll bg-white dark:bg-gray-800 ${size === 'sm' ? 'p-6' : 'p-6 md:p-8'}`}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
