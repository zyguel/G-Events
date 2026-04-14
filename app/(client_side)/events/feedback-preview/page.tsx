/**
 * PREVIEW-ONLY PAGE — Remove before production.
 * Renders the FeedbackFormClient with mock data so you can see the UI
 * without needing an ended event or a checked-in registration.
 * Access at: /events/feedback-preview
 */
import FeedbackFormClient from "@/components/client/FeedbackFormClient";
import ClientHeader from "@/components/client/ClientHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const MOCK_FORM = {
    id: 1,
    event_id: 999,
    title: "Post-Event Feedback",
    description: "We'd love to hear your thoughts on the event! Your responses help us improve future experiences.",
    is_active: true,
    created_at: new Date().toISOString(),
    FeedbackQuestion: [
        {
            id: 1,
            question_text: "Overall, how would you rate this event?",
            input_format: "rating" as const,
            options: null,
            is_required: true,
            display_order: 0,
            order: 0,
        },
        {
            id: 2,
            question_text: "What did you enjoy most about the event?",
            input_format: "text" as const,
            options: null,
            is_required: true,
            display_order: 1,
            order: 1,
        },
        {
            id: 3,
            question_text: "How did you hear about this event?",
            input_format: "multiple_choice" as const,
            options: JSON.stringify(["Social Media", "Friend / Colleague", "Email Newsletter", "Search Engine", "Other"]),
            is_required: false,
            display_order: 2,
            order: 2,
        },
        {
            id: 4,
            question_text: "Which sessions did you find most valuable?",
            input_format: "checkbox" as const,
            options: JSON.stringify(["Opening Keynote", "Workshop A", "Workshop B", "Panel Discussion", "Networking Session"]),
            is_required: false,
            display_order: 3,
            order: 3,
        },
        {
            id: 5,
            question_text: "Any additional comments or suggestions?",
            input_format: "text" as const,
            options: null,
            is_required: false,
            display_order: 4,
            order: 4,
        },
    ],
};

export default function FeedbackPreviewPage() {
    return (
        <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
            <ClientHeader />

            {/* Preview banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/40 px-4 py-2.5 text-center">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                    🎨 UI Preview Mode — This page is for design review only
                </span>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6">
                <Link
                    href="/home"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400 transition-colors group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                    Back to Home
                </Link>
            </div>

            <FeedbackFormClient
                eventId={999}
                eventTitle="G-Summit 2025"
                registrationId={0}
                form={MOCK_FORM}
            />
        </div>
    );
}
