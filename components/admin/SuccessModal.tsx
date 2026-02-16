"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, LayoutDashboard, Eye } from "lucide-react";
import Link from "next/link";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void; // Optional, might not be needed if actions redirect
    eventName: string;
    eventId: string | number;
    onGoToDashboard: () => void;
}

export default function SuccessModal({ isOpen, onClose, eventName, eventId, onGoToDashboard }: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center"
                    >
                        {/* Success Header with Animation */}
                        <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Animated Background Circles */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="absolute w-64 h-64 bg-white/20 rounded-full blur-3xl -top-10 -left-10 pointer-events-none"
                            />

                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 mb-4"
                            >
                                <Check className="w-10 h-10 text-emerald-500 stroke-[3]" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold text-white relative z-10"
                            >
                                Published Successfully!
                            </motion.h2>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Your event has been successfully published and is now live.
                                </p>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 py-3 px-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                    {eventName}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Link
                                    href={`/events/${eventId}/overview`}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md group"
                                >
                                    <Eye size={18} />
                                    View Event
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={onGoToDashboard}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-medium transition-all"
                                >
                                    <LayoutDashboard size={18} />
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
