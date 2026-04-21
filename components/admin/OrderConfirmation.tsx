"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle, Mail, Check, X } from "lucide-react";
import { getOrderConfirmationSettings, saveOrderConfirmationSettings } from "@/lib/actions/orderConfirmation";
import type { OrderConfirmationData } from "@/lib/orderConfirmationSettings";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
    ssr: false,
    loading: () => (
        <div className="min-h-55 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />
    ),
});

export default function OrderConfirmation({ eventId }: { eventId: string }) {
    const [savedStates, setSavedStates] = useState({
        submissionEmail: false,
        confirmationEmail: false,
        rejectionEmail: false
    });

    const [data, setData] = useState<OrderConfirmationData>({
        submissionMessage: "",
        submissionEmail: {
            subject: "",
            body: ""
        },
        confirmationEmail: {
            subject: "",
            body: ""
        },
        rejectionEmail: {
            subject: "",
            body: ""
        },
        freeTicketApprovalMode: "manual",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState<OrderConfirmationData | null>(null);
    const [noChangeStates, setNoChangeStates] = useState({
        submissionEmail: false,
        confirmationEmail: false,
        rejectionEmail: false,
    });

    // Fetch initial data
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const fetchedData = await getOrderConfirmationSettings(parseInt(eventId, 10));

                // If data exists, populate the form
                if (fetchedData) {
                    setData(fetchedData);
                    setInitialData(fetchedData);
                } else {
                    setInitialData({
                        submissionMessage: "",
                        submissionEmail: { subject: "", body: "" },
                        confirmationEmail: { subject: "", body: "" },
                        rejectionEmail: { subject: "", body: "" },
                        freeTicketApprovalMode: "manual",
                    });
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (eventId) {
            loadSettings();
        }
    }, [eventId]);

    const hasSectionChanged = (type: 'submission' | 'confirmation' | 'rejection') => {
        if (!initialData) {
            return false;
        }

        if (type === 'submission') {
            return data.submissionEmail.subject !== initialData.submissionEmail.subject
                || data.submissionEmail.body !== initialData.submissionEmail.body;
        }

        if (type === 'confirmation') {
            return data.confirmationEmail.subject !== initialData.confirmationEmail.subject
                || data.confirmationEmail.body !== initialData.confirmationEmail.body;
        }

        return data.rejectionEmail.subject !== initialData.rejectionEmail.subject
            || data.rejectionEmail.body !== initialData.rejectionEmail.body;
    };

    const handleSaveEmail = async (type: 'submission' | 'confirmation' | 'rejection') => {
        if (!hasSectionChanged(type)) {
            const key = `${type}Email` as keyof typeof noChangeStates;
            setNoChangeStates((prev) => ({ ...prev, [key]: true }));
            setTimeout(() => setNoChangeStates((prev) => ({ ...prev, [key]: false })), 3000);
            return;
        }

        try {
            await saveOrderConfirmationSettings(parseInt(eventId, 10), data);
            setInitialData(data);
            const key = `${type}Email` as keyof typeof savedStates;
            setSavedStates((prev) => ({ ...prev, [key]: true }));
            setTimeout(() => setSavedStates((prev) => ({ ...prev, [key]: false })), 3000);
        } catch (error) {
            console.error(`Failed to save ${type} email:`, error);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto p-8 space-y-6 pb-20 font-sans flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6 pb-20 font-sans">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Order Confirmation
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Configure automated email templates for event registration workflows
                    </p>
                </div>
            </div>

            {/* Registration Submission E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Registration Submission E-mail
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                This is the e-mail sent to the user once they have completed submission
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={data.submissionEmail.subject}
                            onChange={(e) => setData({ ...data, submissionEmail: { ...data.submissionEmail, subject: e.target.value } })}
                            placeholder="Enter email subject..."
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Body <span className="text-red-500">*</span></label>
                        <RichTextEditor
                            content={data.submissionEmail.body}
                            onChange={(html) => setData({ ...data, submissionEmail: { ...data.submissionEmail, body: html } })}
                            placeholder="Write your submission email content here..."
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        {noChangeStates.submissionEmail && (
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                No changes to save.
                            </span>
                        )}
                        {savedStates.submissionEmail && (
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                ✓ Changes saved
                            </span>
                        )}
                        <button
                            onClick={() => handleSaveEmail('submission')}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.02] rounded-xl transition-all duration-200"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </section>

            {/* Registration Confirmation E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Registration Confirmation E-mail
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                This is the e-mail sent to the user once their registration has been reviewed and confirmed
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={data.confirmationEmail.subject}
                            onChange={(e) => setData({ ...data, confirmationEmail: { ...data.confirmationEmail, subject: e.target.value } })}
                            placeholder="Enter email subject..."
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Body <span className="text-red-500">*</span></label>
                        <RichTextEditor
                            content={data.confirmationEmail.body}
                            onChange={(html) => setData({ ...data, confirmationEmail: { ...data.confirmationEmail, body: html } })}
                            placeholder="Write your confirmation email content here..."
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        {noChangeStates.confirmationEmail && (
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                No changes to save.
                            </span>
                        )}
                        {savedStates.confirmationEmail && (
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                ✓ Changes saved
                            </span>
                        )}
                        <button
                            onClick={() => handleSaveEmail('confirmation')}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.02] rounded-xl transition-all duration-200"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </section>

            {/* Registration Rejection E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Registration Rejection E-mail
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                This is the e-mail sent to the user once their registration has been rejected
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={data.rejectionEmail.subject}
                            onChange={(e) => setData({ ...data, rejectionEmail: { ...data.rejectionEmail, subject: e.target.value } })}
                            placeholder="Enter email subject..."
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Body <span className="text-red-500">*</span></label>
                        <RichTextEditor
                            content={data.rejectionEmail.body}
                            onChange={(html) => setData({ ...data, rejectionEmail: { ...data.rejectionEmail, body: html } })}
                            placeholder="Write your rejection email content here..."
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        {noChangeStates.rejectionEmail && (
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                No changes to save.
                            </span>
                        )}
                        {savedStates.rejectionEmail && (
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                ✓ Changes saved
                            </span>
                        )}
                        <button
                            onClick={() => handleSaveEmail('rejection')}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:shadow-lg hover:scale-[1.02] rounded-xl transition-all duration-200"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
