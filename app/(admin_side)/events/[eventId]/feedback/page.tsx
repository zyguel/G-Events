"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  Star,
  AlignLeft,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquareDot,
  Settings2,
  ToggleRight,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "rating" | "text" | "multiple_choice" | "checkbox";

interface Question {
  id: string; // local UI id (may be "new-xxx" for unsaved)
  dbId?: number; // real DB id once saved
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  placeholder?: string;
  displayOrder: number;
}

interface FeedbackFormDB {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  FeedbackQuestion: {
    id: number;
    question_text: string;
    input_format: string;
    options: string | null;
    is_required: boolean;
    display_order: number;
    order: number;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => "new-" + Math.random().toString(36).slice(2, 9);

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: "rating", label: "Star Rating", icon: <Star size={15} /> },
  { value: "text", label: "Open-ended", icon: <AlignLeft size={15} /> },
  { value: "multiple_choice", label: "Multiple Choice", icon: <ChevronDown size={15} /> },
  { value: "checkbox", label: "Checkboxes", icon: <CheckSquare size={15} /> },
];

const defaultQuestion = (type: QuestionType, order: number): Question => ({
  id: uid(),
  type,
  label: "",
  required: false,
  options: type === "multiple_choice" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
  maxRating: type === "rating" ? 5 : undefined,
  placeholder: type === "text" ? "Type your answer here…" : undefined,
  displayOrder: order,
});

function dbQuestionToLocal(q: FeedbackFormDB["FeedbackQuestion"][0], idx: number): Question {
  let options: string[] | undefined;
  if (q.options) {
    try {
      const parsed = JSON.parse(q.options);
      options = Array.isArray(parsed) ? parsed.map(String) : String(q.options).split(",").map(s => s.trim());
    } catch {
      options = String(q.options).split(",").map(s => s.trim());
    }
  }

  return {
    id: String(q.id),
    dbId: q.id,
    type: q.input_format as QuestionType,
    label: q.question_text,
    required: q.is_required,
    options,
    maxRating: q.input_format === "rating" ? 5 : undefined,
    displayOrder: q.display_order ?? q.order ?? idx,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: QuestionType }) {
  const map: Record<QuestionType, { label: string; color: string }> = {
    rating: { label: "Star Rating", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    text: { label: "Open-ended", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    multiple_choice: { label: "Multiple Choice", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    checkbox: { label: "Checkboxes", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  };
  const { label, color } = map[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

function StarPreview({ max }: { max: number }) {
  return (
    <div className="flex gap-1 mt-2">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={22} className="text-amber-400 fill-amber-400 opacity-40" />
      ))}
    </div>
  );
}

function QuestionCard({
  q,
  index,
  onChange,
  onDelete,
  onDuplicate,
}: {
  q: Question;
  index: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateField = <K extends keyof Question>(key: K, val: Question[K]) =>
    onChange({ ...q, [key]: val });

  const updateOption = (i: number, val: string) => {
    const opts = [...(q.options ?? [])];
    opts[i] = val;
    updateField("options", opts);
  };

  const addOption = () => updateField("options", [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`]);
  const removeOption = (i: number) => updateField("options", (q.options ?? []).filter((_, idx) => idx !== i));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <GripVertical size={16} className="text-gray-300 dark:text-gray-600 cursor-grab shrink-0" />
        <span className="w-6 h-6 rounded-full bg-[#3D518C]/10 text-[#3D518C] dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>

        <input
          type="text"
          value={q.label}
          onChange={(e) => updateField("label", e.target.value)}
          placeholder="Question text…"
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />

        <TypeBadge type={q.type} />

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4">
              {/* Question Type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  Question Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => onChange({ ...defaultQuestion(t.value, q.displayOrder), id: q.id, dbId: q.dbId, label: q.label, required: q.required })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        q.type === t.value
                          ? "bg-[#3D518C] text-white shadow-sm"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {q.type === "rating" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Max Stars
                  </label>
                  <div className="flex items-center gap-3">
                    {[5].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateField("maxRating", n)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all bg-[#3D518C] text-white shadow-sm cursor-default`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <StarPreview max={q.maxRating ?? 5} />
                </div>
              )}

              {q.type === "text" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={q.placeholder ?? ""}
                    onChange={(e) => updateField("placeholder", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                  />
                  <div className="mt-2 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-400 dark:text-gray-500 min-h-[60px]">
                    {q.placeholder || "Type your answer here…"}
                  </div>
                </div>
              )}

              {(q.type === "multiple_choice" || q.type === "checkbox") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Options
                  </label>
                  <div className="space-y-2">
                    {(q.options ?? []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 shrink-0 border-2 border-gray-300 dark:border-gray-500 ${q.type === "checkbox" ? "rounded" : "rounded-full"}`} />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                        />
                        <button
                          onClick={() => removeOption(i)}
                          disabled={(q.options?.length ?? 0) <= 1}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="flex items-center gap-1 text-xs text-[#3D518C] dark:text-indigo-400 font-medium hover:underline mt-1"
                    >
                      <Plus size={13} /> Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Required toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Required</span>
                <button
                  onClick={() => updateField("required", !q.required)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    q.required ? "bg-[#3D518C]" : "bg-gray-200 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      q.required ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ questions, onClose }: { questions: Question[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-br from-[#3D518C] to-[#091540] px-8 py-6 rounded-t-3xl text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-1">Post-Event Feedback</p>
          <h2 className="text-xl font-bold">We'd love your feedback! 🎉</h2>
          <p className="text-sm text-indigo-100 mt-1">Help us improve future events by sharing your thoughts.</p>
        </div>

        <div className="px-8 py-6 space-y-8">
          {questions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No questions yet — add some above.</p>
          ) : (
            questions.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  {i + 1}. {q.label || "Untitled question"}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </p>

                {q.type === "rating" && (
                  <div className="flex gap-2">
                    {Array.from({ length: q.maxRating ?? 5 }).map((_, si) => (
                      <button key={si} className="group">
                        <Star size={28} className="text-gray-300 dark:text-gray-600 group-hover:text-amber-400 group-hover:fill-amber-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "text" && (
                  <textarea
                    placeholder={q.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] resize-none"
                  />
                )}

                {(q.type === "multiple_choice" || q.type === "checkbox") && (
                  <div className="space-y-2">
                    {(q.options ?? []).map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type={q.type === "checkbox" ? "checkbox" : "radio"}
                          name={`q-${q.id}`}
                          className="w-4 h-4 accent-[#3D518C]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          <button className="w-full py-3 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            Submit Feedback
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const params = useParams();
  const rawEventId = params?.eventId as string;
  // Admin URLs use slugs like "event-name-42" — extract the numeric ID from the end
  const eventId = rawEventId?.split("-").pop() ?? "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [formId, setFormId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("Post-Event Feedback");
  const [formDescription, setFormDescription] = useState("We value your feedback! Please share your experience.");
  const [isEnabled, setIsEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Load existing form ──────────────────────────────────────────────────────

  const loadForm = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setLoadError(null);
    try {
      // GET /api/feedback/form/[eventId] — loads form regardless of is_active
      const res = await fetch(`/api/feedback/form/${eventId}`);
      if (res.status === 404) {
        // No form yet — start with defaults
        setFormId(null);
        setQuestions([
          { ...defaultQuestion("rating", 0), label: "How would you rate the overall event experience?" },
          { ...defaultQuestion("text", 1), label: "What did you enjoy most about the event?", placeholder: "Share your highlights…" },
        ]);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load feedback form");

      const json = await res.json();
      if (!json.success || !json.data) {
        // No form yet — start with defaults
        setFormId(null);
        setQuestions([
          { ...defaultQuestion("rating", 0), label: "How would you rate the overall event experience?" },
          { ...defaultQuestion("text", 1), label: "What did you enjoy most about the event?", placeholder: "Share your highlights…" },
        ]);
        setLoading(false);
        return;
      }

      const form: FeedbackFormDB = json.data;
      setFormId(form.id);
      setFormTitle(form.title || "Post-Event Feedback");
      setFormDescription(form.description || "");
      setIsEnabled(form.is_active ?? true);

      const sorted = [...(form.FeedbackQuestion || [])].sort(
        (a, b) => (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0)
      );
      setQuestions(sorted.map((q, i) => dbQuestionToLocal(q, i)));
    } catch (e: any) {
      setLoadError(e.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, defaultQuestion(type, prev.length)]);
  };

  const updateQuestion = (id: string, updated: Question) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));

  const deleteQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const duplicateQuestion = (q: Question) =>
    setQuestions((prev) => {
      const idx = prev.findIndex((item) => item.id === q.id);
      const clone = { ...q, id: uid(), dbId: undefined, displayOrder: q.displayOrder + 0.5 };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next.map((item, i) => ({ ...item, displayOrder: i }));
    });

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!eventId) return;
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);

    try {
      const payload = {
        title: formTitle.trim() || "Post-Event Feedback",
        description: formDescription.trim() || null,
        is_active: isEnabled,
        questions: questions.map((q, i) => ({
          question_text: q.label.trim() || "Untitled question",
          input_format: q.type,
          options: (q.type === "multiple_choice" || q.type === "checkbox")
            ? (q.options ?? [])
            : undefined,
          is_required: q.required,
          display_order: i,
        })),
      };

      const res = await fetch(`/api/feedback/form/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Failed to save feedback form");
      }

      // Reload to get fresh DB ids on all questions
      await loadForm();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e: any) {
      setSaveStatus("error");
      setSaveError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Loading feedback form…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Failed to load feedback form</p>
          <p className="text-xs text-gray-500">{loadError}</p>
          <button
            onClick={loadForm}
            className="mt-2 px-4 py-2 text-sm font-semibold bg-[#3D518C] text-white rounded-xl hover:bg-[#2d3d6b] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquareDot size={20} className="text-[#3D518C] dark:text-indigo-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Form</h1>
                {formId && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    ID #{formId}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Build a post-event survey — it appears to checked-in attendees once the event ends.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <Eye size={15} /> Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                  saveStatus === "saved"
                    ? "bg-green-500 text-white"
                    : saveStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-[#3D518C] hover:bg-[#2d3d6b] text-white"
                }`}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? "Saving…" : saveStatus === "saved" ? "✓ Saved!" : saveStatus === "error" ? "Save Failed" : "Save Form"}
              </button>
            </div>
          </div>

          {/* Save error banner */}
          {saveStatus === "error" && saveError && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
            </div>
          )}

          {/* ── Form Metadata ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <Settings2 size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Form Settings</h2>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Form Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Post-Event Feedback"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Description <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Add a short intro for respondents…"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] resize-none"
              />
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable Feedback Form</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Checked-in attendees will see this form after the event ends.
                </p>
              </div>
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  isEnabled ? "bg-[#3D518C]" : "bg-gray-200 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2">
              <ToggleRight size={14} className={isEnabled ? "text-green-500" : "text-gray-400"} />
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {isEnabled ? "Active — will be shown post-event" : "Disabled — form won't be shown"}
              </span>
            </div>
          </div>

          {/* ── Questions ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Questions ({questions.length})
              </h2>
            </div>

            <AnimatePresence>
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  onChange={(updated) => updateQuestion(q.id, updated)}
                  onDelete={() => deleteQuestion(q.id)}
                  onDuplicate={() => duplicateQuestion(q)}
                />
              ))}
            </AnimatePresence>

            {questions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600"
              >
                <MessageSquareDot size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No questions yet. Add your first one below.</p>
              </motion.div>
            )}
          </div>

          {/* ── Add Question Section ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Add Question
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => addQuestion(t.value)}
                  className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-[#3D518C] hover:text-[#3D518C] dark:hover:border-indigo-400 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-xs font-medium transition-all group"
                >
                  <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-[#3D518C]/10 dark:group-hover:bg-indigo-900/30 transition-colors">
                    {t.icon}
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Save Footer ── */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                saveStatus === "saved"
                  ? "bg-green-500 text-white"
                  : saveStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : saveStatus === "saved" ? "✓ Form Saved!" : saveStatus === "error" ? "Save Failed — Retry" : "Save Feedback Form"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {showPreview && (
          <PreviewModal questions={questions} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
