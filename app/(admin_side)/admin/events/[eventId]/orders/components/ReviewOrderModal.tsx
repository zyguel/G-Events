import { X, ChevronLeft, ChevronRight, Check, X as XIcon, Download, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "../ManageOrdersClient";

interface ReviewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onConfirm: (orderId: string) => void;
    onReject: (orderId: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

export default function ReviewOrderModal({
    isOpen,
    onClose,
    order,
    onConfirm,
    onReject,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
}: ReviewOrderModalProps) {
    const [isImageExpanded, setIsImageExpanded] = useState(false);
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

    if (!mounted || !isOpen || !order) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-[2px]"
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] font-sans"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Review Order #{order.id}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-4">
                                        <button
                                            onClick={onPrevious}
                                            disabled={!hasPrevious}
                                            className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                                        <button
                                            onClick={onNext}
                                            disabled={!hasNext}
                                            className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                    {/* Proof of Payment Section */}
                                    <div className="space-y-4 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Proof of Payment</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsImageExpanded(true)}
                                                    className="flex items-center gap-1.5 text-xs text-[#3D518C] dark:text-[#ABD2FA] font-medium hover:underline"
                                                >
                                                    <Maximize2 size={14} /> Expand
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-[300px] relative group overflow-hidden">
                                            {order.proofOfPayment ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={order.proofOfPayment}
                                                        alt="Proof of Payment"
                                                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                                    />
                                                </>
                                            ) : (
                                                <div className="text-center text-gray-400">
                                                    <p>No proof of payment uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Details Section */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Registration Details</h4>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{order.name}</p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg col-span-2">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{order.email}</p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ticket Type</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.ticketType}</p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Registration Type</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.registrationType}</p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date Submitted</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.date}</p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Time Submitted</p>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between shrink-0">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Reviewing order <span className="font-medium text-gray-900 dark:text-white">#{order.id}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onReject(order.id)}
                                        className="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <XIcon size={16} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => onConfirm(order.id)}
                                        className="px-4 py-2 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2a3a5e] hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <Check size={16} />
                                        Confirm Order
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Expanded Image Modal */}
                    <AnimatePresence>
                        {isImageExpanded && order.proofOfPayment && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
                                onClick={() => setIsImageExpanded(false)}
                            >
                                <div className="absolute top-4 right-4">
                                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={order.proofOfPayment}
                                    alt="Proof of Payment Full"
                                    className="max-w-full max-h-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
