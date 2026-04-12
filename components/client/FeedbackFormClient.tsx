"use client";

import React, { useState } from "react";
import { Star, MessageSquare, CheckSquare, ChevronRight, Send, Sparkles, CheckCircle2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedbackQuestion {
    id: number;
    question_text: string;
    input_format: "rating" | "text" | "multiple_choice" | "checkbox";
    options?: string | string[] | null;
    is_required: boolean;
    display_order?: number;
    order?: number;
}

interface FeedbackFormData {
    id: number;
    event_id: number;
    title: string;
    description?: string | null;
    is_active: boolean;
    FeedbackQuestion: FeedbackQuestion[];
}

interface FeedbackFormClientProps {
    eventId: number;
    eventTitle: string;
    registrationId: number;
    form: FeedbackFormData;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseOptions(raw: string | string[] | null | undefined): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    try {
        const parsed = JSON.parse(raw as string);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        return [];
    } catch {
        return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    }
}

// ── Question icon ─────────────────────────────────────────────────────────────

function QuestionIcon({ format }: { format: FeedbackQuestion["input_format"] }) {
    const map = {
        rating: <Star size={15} className="text-amber-500" />,
        text: <MessageSquare size={15} className="text-blue-500" />,
        multiple_choice: <ChevronRight size={15} className="text-indigo-500" />,
        checkbox: <CheckSquare size={15} className="text-emerald-500" />,
    };
    return map[format] ?? null;
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (v: number) => void;
    disabled: boolean;
}) {
    const [hovered, setHovered] = useState(0);
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="group transition-transform duration-100 hover:scale-110 active:scale-95 disabled:cursor-not-allowed"
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    >
                        <Star
                            size={36}
                            className={`transition-all duration-150 ${
                                star <= (hovered || value)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-gray-300 dark:text-gray-600"
                            }`}
                        />
                    </button>
                ))}
            </div>
            <span
                className={`text-sm font-semibold transition-all duration-200 ${
                    (hovered || value) > 0
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-gray-400 dark:text-gray-500"
                }`}
            >
                {labels[hovered || value] || "Tap to rate"}
            </span>
        </div>
    );
}

// ── Question Field ────────────────────────────────────────────────────────────

function QuestionField({
    question,
    value,
    onChange,
    disabled,
    showError,
}: {
    question: FeedbackQuestion;
    value: string | string[];
    onChange: (v: string | string[]) => void;
    disabled: boolean;
    showError: boolean;
}) {
    const options = parseOptions(question.options);

    if (question.input_format === "rating") {
        const numVal = Number(value) || 0;
        return (
            <div className="flex justify-center py-2">
                <StarRating
                    value={numVal}
                    onChange={(v) => onChange(String(v))}
                    disabled={disabled}
                />
            </div>
        );
    }

    if (question.input_format === "text") {
        return (
            <textarea
                rows={4}
                disabled={disabled}
                value={String(value)}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Share your thoughts…"
                className={`w-full px-4 py-3 rounded-2xl border text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    showError
                        ? "border-red-400 dark:border-red-500 focus:ring-red-300"
                        : "border-gray-200 dark:border-gray-700 focus:ring-[#5C6BC0]/50 dark:focus:ring-[#5C6BC0]/40"
                }`}
            />
        );
    }

    if (question.input_format === "multiple_choice") {
        return (
            <div className="flex flex-col gap-2.5">
                {options.map((opt) => {
                    const selected = String(value) === opt;
                    return (
                        <button
                            key={opt}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(opt)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium text-left transition-all duration-200 disabled:cursor-not-allowed ${
                                selected
                                    ? "border-[#3D518C] bg-[#3D518C]/10 dark:bg-[#3D518C]/20 text-[#3D518C] dark:text-[#ABD2FA]"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:border-[#5C6BC0]/50 hover:bg-[#5C6BC0]/5"
                            }`}
                        >
                            <span
                                className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all duration-200 ${
                                    selected
                                        ? "border-[#3D518C] bg-[#3D518C] dark:border-[#ABD2FA] dark:bg-[#ABD2FA]"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                            />
                            {opt}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (question.input_format === "checkbox") {
        const selectedValues = Array.isArray(value) ? value : String(value) ? String(value).split(",").map(s => s.trim()) : [];
        const toggle = (opt: string) => {
            const next = selectedValues.includes(opt)
                ? selectedValues.filter((v) => v !== opt)
                : [...selectedValues, opt];
            onChange(next);
        };

        return (
            <div className="flex flex-col gap-2.5">
                {options.map((opt) => {
                    const checked = selectedValues.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(opt)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium text-left transition-all duration-200 disabled:cursor-not-allowed ${
                                checked
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:border-emerald-400/50 hover:bg-emerald-50/50"
                            }`}
                        >
                            <span
                                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                                    checked
                                        ? "border-emerald-500 bg-emerald-500"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                            >
                                {checked && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                            {opt}
                        </button>
                    );
                })}
            </div>
        );
    }

    return null;
}

// ── Success State ─────────────────────────────────────────────────────────────

function SuccessState({ eventTitle }: { eventTitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            {/* Animated ring */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-[bounce_0.6s_ease-out]">
                    <CheckCircle2 size={44} className="text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles size={14} className="text-white" />
                </span>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Thank You!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                Your feedback for{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{eventTitle}</span>{" "}
                has been submitted. We really appreciate your time.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                <a
                    href="/tickets"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                    My Tickets
                </a>
                <a
                    href="/home"
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                    Browse Events
                </a>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FeedbackFormClient({
    eventId,
    eventTitle,
    registrationId,
    form,
}: FeedbackFormClientProps) {
    // Sort questions by display_order / order
    const questions = [...form.FeedbackQuestion].sort(
        (a, b) => (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0)
    );

    // Initialize answers map: questionId -> answer value
    const initialAnswers: Record<number, string | string[]> = {};
    questions.forEach((q) => {
        initialAnswers[q.id] = q.input_format === "checkbox" ? [] : "";
    });

    const [answers, setAnswers] = useState<Record<number, string | string[]>>(initialAnswers);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<number, boolean>>({});

    const handleChange = (questionId: number, value: string | string[]) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        setTouched((prev) => ({ ...prev, [questionId]: true }));
    };

    const validateField = (q: FeedbackQuestion) => {
        if (!q.is_required) return true;
        const val = answers[q.id];
        if (Array.isArray(val)) return val.length > 0;
        return String(val || "").trim().length > 0;
    };

    const hasError = (q: FeedbackQuestion) => touched[q.id] && !validateField(q);
    const totalRequired = questions.filter((q) => q.is_required).length;
    const answeredRequired = questions.filter((q) => q.is_required && validateField(q)).length;
    const progress = totalRequired > 0 ? Math.round((answeredRequired / totalRequired) * 100) : 100;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all required as touched to reveal errors
        const newTouched: Record<number, boolean> = {};
        questions.forEach((q) => { if (q.is_required) newTouched[q.id] = true; });
        setTouched((prev) => ({ ...prev, ...newTouched }));

        const allValid = questions.every((q) => validateField(q));
        if (!allValid) return;

        setSubmitting(true);

        // Build payload (for future submission wiring)
        const payload = {
            registration_id: registrationId,
            answers: questions.map((q) => {
                const val = answers[q.id];
                return {
                    question_id: q.id,
                    answer: Array.isArray(val) ? val.join(", ") : String(val),
                };
            }),
        };

        // TODO: wire up real submission
        console.log("[FeedbackFormClient] Submitting payload:", payload);

        // Simulate network delay for UX
        await new Promise((res) => setTimeout(res, 800));

        setSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
                    <SuccessState eventTitle={eventTitle} />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* ── Header card ───────────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#3D518C] via-[#4a60a8] to-[#5C6BC0] rounded-3xl p-8 shadow-xl shadow-blue-500/20">
                    {/* Decorative blobs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 bg-white/10 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                            <Sparkles size={11} />
                            Post-Event Feedback
                        </span>
                        <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">
                            {form.title}
                        </h1>
                        {form.description && (
                            <p className="text-sm text-blue-100/80 leading-relaxed">
                                {form.description}
                            </p>
                        )}
                        <p className="text-xs text-blue-200/60 mt-3">
                            For: <span className="font-semibold text-blue-100">{eventTitle}</span>
                        </p>
                    </div>

                    {/* Progress bar */}
                    {totalRequired > 0 && (
                        <div className="relative z-10 mt-6">
                            <div className="flex items-center justify-between text-xs text-blue-200/80 mb-1.5">
                                <span>{answeredRequired} of {totalRequired} required answered</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Questions ─────────────────────────────────────────────── */}
                {questions.map((q, idx) => {
                    const error = hasError(q);
                    return (
                        <div
                            key={q.id}
                            className={`bg-white dark:bg-gray-900/80 border rounded-3xl p-6 shadow-sm transition-all duration-200 ${
                                error
                                    ? "border-red-300 dark:border-red-500/60"
                                    : "border-gray-100 dark:border-gray-800"
                            }`}
                        >
                            {/* Question header */}
                            <div className="flex items-start gap-2 mb-4">
                                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <QuestionIcon format={q.input_format} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                                        {idx + 1}. {q.question_text}
                                        {q.is_required && (
                                            <span className="ml-1 text-red-500">*</span>
                                        )}
                                    </p>
                                    {q.input_format === "checkbox" && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            Select all that apply
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Field */}
                            <QuestionField
                                question={q}
                                value={answers[q.id]}
                                onChange={(val) => handleChange(q.id, val)}
                                disabled={submitting}
                                showError={error}
                            />

                            {/* Validation error */}
                            {error && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-2.5 font-medium">
                                    This field is required.
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* ── Submit ────────────────────────────────────────────────── */}
                <div className="pb-8">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        {submitting ? (
                            <>
                                <svg
                                    className="w-5 h-5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                                    />
                                </svg>
                                Submitting…
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Submit Feedback
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                        Fields marked with <span className="text-red-500">*</span> are required.
                    </p>
                </div>

            </div>
        </form>
    );
}
