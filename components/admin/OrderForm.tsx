"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Copy, Eye, EyeOff, ClipboardList, Upload, Grid3X3, Save, Loader } from "lucide-react";

type InputType = "short_answer" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "file_upload" | "multiple_choice_grid" | "checkbox_grid" | "date" | "time";

interface FormInput {
    id: string;
    question: string;
    type: InputType;
    fieldIdentifier: string;
    required: boolean;
    options?: string[];
}

interface FormSection {
    id: string;
    title: string;
    description: string;
    inputs: FormInput[];
}

interface OrderFormData {
    sections: FormSection[];
}

const INPUT_TYPES = [
    { value: "short_answer", label: "Short Answer" },
    { value: "paragraph", label: "Paragraph" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "checkboxes", label: "Checkboxes" },
    { value: "dropdown", label: "Dropdown" },
    { value: "file_upload", label: "File Upload" },
    { value: "date", label: "Date" },
    { value: "time", label: "Time" }
];

const FIELD_IDENTIFIERS = [
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone Number" },
    { value: "gender", label: "Gender" },
    { value: "age", label: "Age" },
    { value: "date_of_birth", label: "Date of Birth" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State/Province" },
    { value: "country", label: "Country" },
    { value: "zip_code", label: "ZIP/Postal Code" },
    { value: "company", label: "Company" },
    { value: "job_title", label: "Job Title" },
    { value: "department", label: "Department" },
    { value: "dietary_restrictions", label: "Dietary Restrictions" },
    { value: "special_needs", label: "Special Needs" },
    { value: "agree_to_terms", label: "Agree to Terms" },
    { value: "newsletter_signup", label: "Newsletter Signup" },
    { value: "proof_of_payment", label: "Proof of payment (file) — group: primary only" },
    { value: "payment_reference", label: "Payment reference / code — group: primary only" },
    { value: "custom", label: "Custom Field" }
];

export default function OrderForm({ 
    eventId, 
    formId,
    eventSlug,
    initialTitle = "New Order Form",
    initialDescription = ""
}: { 
    eventId: string
    formId?: string
    eventSlug?: string
    initialTitle?: string
    initialDescription?: string
}) {
    const router = useRouter();
    const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId);
    const eventPathId = eventSlug ?? eventId;
    const [data, setData] = useState<OrderFormData>({
        sections: [
            {
                id: "section-1",
                title: "Personal Information",
                description: "Please provide your basic information",
                inputs: [
                    {
                        id: "input-1",
                        question: "Full Name",
                        type: "short_answer",
                        fieldIdentifier: "first_name",
                        required: true
                    }
                ]
            }
        ]
    });

    const [formTitle, setFormTitle] = useState(initialTitle);
    const [formDescription, setFormDescription] = useState(initialDescription);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editingInput, setEditingInput] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const lastLoadedIdRef = useRef<string | null>(null);

    const loadForm = async (id: number) => {
        const idStr = id.toString();
        if (lastLoadedIdRef.current === idStr) return;
        
        setIsLoading(true);
        try {
            console.log('Fetching form from API:', id);
            const response = await fetch(`/api/orderform/${id}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.data && result.success) {
                setFormTitle(result.data.title || initialTitle);
                setFormDescription(result.data.description || initialDescription);
                if (result.data.form_data) {
                    setData(result.data.form_data);
                }
                setSaveMessage(null);
                setHasLoaded(true);
                lastLoadedIdRef.current = idStr;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (e) {
            console.error('Failed to load form:', e);
            setSaveMessage({ type: 'error', text: `Failed to load form: ${e instanceof Error ? e.message : 'Unknown error'}` });
            setHasLoaded(true);
        } finally {
            setIsLoading(false);
        }
    };

    const loadExistingFormForEvent = async (eventIdNum: number) => {
        if (lastLoadedIdRef.current === `checked-event-${eventIdNum}`) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/orderform?eventId=${eventIdNum}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            const existingForm = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;

            if (existingForm) {
                const foundId = existingForm.id?.toString();
                setCurrentFormId(foundId);
                setFormTitle(existingForm.title || initialTitle);
                setFormDescription(existingForm.description || initialDescription);
                if (existingForm.form_data) {
                    setData(existingForm.form_data);
                }
                setSaveMessage(null);
                lastLoadedIdRef.current = foundId;

                // Sync URL if needed
                if (formId !== foundId) {
                    try {
                        router.replace(`/admin/events/${eventPathId}/orderform?formId=${foundId}`);
                    } catch {
                        // ignore navigation errors
                    }
                }
            } else {
                lastLoadedIdRef.current = `checked-event-${eventIdNum}`;
            }

            setHasLoaded(true);
        } catch (e) {
            console.error('Failed to load existing form for event:', e);
            setSaveMessage({ type: 'error', text: `Failed to load form: ${e instanceof Error ? e.message : 'Unknown error'}` });
            setHasLoaded(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Load existing form on mount or when identifiers change
    useEffect(() => {
        // If the current prop matches what we last loaded, don't re-fetch
        if (formId && formId === lastLoadedIdRef.current) return;
        
        const init = async () => {
            const eventIdNum = parseInt(eventId);
            if (formId) {
                await loadForm(parseInt(formId));
                setCurrentFormId(formId);
            } else if (!isNaN(eventIdNum)) {
                await loadExistingFormForEvent(eventIdNum);
            } else {
                setIsLoading(false);
                setHasLoaded(true);
            }
        };

        init();
    }, [eventId, formId]);

    const handleSaveForm = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const endpoint = currentFormId 
                ? `/api/orderform/${currentFormId}`
                : '/api/orderform';
            
            const method = currentFormId ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: parseInt(eventId),
                    title: formTitle,
                    description: formDescription,
                    form_data: data
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save form');
            }

            const result = await response.json();

            if (result.success) {
                setSaveMessage({ type: 'success', text: result.message || 'Form saved successfully!' });
                
                // If this was a new form (no currentFormId), navigate with the returned formId as query param
                if (!currentFormId && result.formId) {
                    setCurrentFormId(result.formId.toString());
                    setTimeout(() => {
                        router.push(`/admin/events/${eventPathId}/orderform?formId=${result.formId}`);
                    }, 1500); // Wait a bit so user sees success message
                }
                
                // Auto-dismiss message after 3 seconds
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: result.error || 'Failed to save form' });
            }
        } catch (e) {
            setSaveMessage({ type: 'error', text: e instanceof Error ? e.message : 'An error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    // Section operations
    const addSection = () => {
        const newSection: FormSection = {
            id: `section-${Date.now()}`,
            title: "New Section",
            description: "",
            inputs: []
        };
        setData({
            ...data,
            sections: [...data.sections, newSection]
        });
    };

    const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
        setData({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId ? { ...s, ...updates } : s
            )
        });
    };

    const deleteSection = (sectionId: string) => {
        setData({
            ...data,
            sections: data.sections.filter(s => s.id !== sectionId)
        });
        setEditingSection(null);
    };

    // Input operations
    const addInput = (sectionId: string) => {
        const newInput: FormInput = {
            id: `input-${Date.now()}`,
            question: "New Question",
            type: "short_answer",
            fieldIdentifier: "custom",
            required: false
        };
        setData({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? { ...s, inputs: [...s.inputs, newInput] }
                    : s
            )
        });
    };

    const updateInput = (sectionId: string, inputId: string, updates: Partial<FormInput>) => {
        setData({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        inputs: s.inputs.map(i =>
                            i.id === inputId ? { ...i, ...updates } : i
                        )
                    }
                    : s
            )
        });
    };

    const deleteInput = (sectionId: string, inputId: string) => {
        setData({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? { ...s, inputs: s.inputs.filter(i => i.id !== inputId) }
                    : s
            )
        });
        setEditingInput(null);
    };

    const duplicateInput = (sectionId: string, inputId: string) => {
        const section = data.sections.find(s => s.id === sectionId);
        if (!section) return;

        const inputToDuplicate = section.inputs.find(i => i.id === inputId);
        if (!inputToDuplicate) return;

        const newInput: FormInput = {
            ...inputToDuplicate,
            id: `input-${Date.now()}`,
            fieldIdentifier: `${inputToDuplicate.fieldIdentifier}_copy`
        };

        setData({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? { ...s, inputs: [...s.inputs, newInput] }
                    : s
            )
        });
    };

    const renderInputPreview = (input: FormInput) => {
        const baseClasses = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent";

        switch (input.type) {
            case "short_answer":
                return <input type="text" className={baseClasses} placeholder="Your answer" disabled />;
            case "paragraph":
                return <textarea className={baseClasses} placeholder="Your answer" rows={4} disabled />;
            case "dropdown":
                return (
                    <select className={baseClasses} disabled>
                        <option>Select an option</option>
                        {input.options?.map((opt, idx) => (
                            <option key={idx}>{opt}</option>
                        ))}
                    </select>
                );
            case "checkboxes":
                return (
                    <div className="space-y-2">
                        {input.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded" disabled />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case "multiple_choice":
                return (
                    <div className="space-y-2">
                        {input.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" className="w-4 h-4" name={input.id} disabled />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case "file_upload":
                return (
                    <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#3D518C] transition-colors bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload file</span>
                        </div>
                        <input type="file" className="hidden" disabled />
                    </label>
                );
            case "multiple_choice_grid":
                return (
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"></th>
                                        {input.options?.slice(0, 3).map((opt, idx) => (
                                            <th key={idx} className="p-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center border border-gray-200 dark:border-gray-600">{opt}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {["Row 1", "Row 2"].map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            <td className="p-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{row}</td>
                                            {input.options?.slice(0, 3).map((_, colIdx) => (
                                                <td key={colIdx} className="p-2 text-center border border-gray-200 dark:border-gray-600">
                                                    <input type="radio" className="w-4 h-4" disabled />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "checkbox_grid":
                return (
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"></th>
                                        {input.options?.slice(0, 3).map((opt, idx) => (
                                            <th key={idx} className="p-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center border border-gray-200 dark:border-gray-600">{opt}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {["Row 1", "Row 2"].map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            <td className="p-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{row}</td>
                                            {input.options?.slice(0, 3).map((_, colIdx) => (
                                                <td key={colIdx} className="p-2 text-center border border-gray-200 dark:border-gray-600">
                                                    <input type="checkbox" className="w-4 h-4 rounded" disabled />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "date":
                return <input type="date" className={baseClasses} disabled />;
            case "time":
                return <input type="time" className={baseClasses} disabled />;
            default:
                return <input type="text" className={baseClasses} placeholder="Your answer" disabled />;
        }
    };

    if (previewMode) {
        return (
            <div className="max-w-3xl mx-auto p-8 space-y-6 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Form Preview</h1>
                    <button
                        onClick={() => setPreviewMode(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <EyeOff className="w-4 h-4" />
                        Exit Preview
                    </button>
                </div>

                {data.sections.map((section) => (
                    <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                            {section.description && (
                                <p className="text-gray-600 dark:text-gray-400 mt-2">{section.description}</p>
                            )}
                        </div>

                        <div className="space-y-6">
                            {section.inputs.map((input) => (
                                <div key={input.id} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {input.question}
                                        {input.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {renderInputPreview(input)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6 pb-20 font-sans">
            {/* Save Status Message */}
            {saveMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    saveMessage.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200'
                }`}>
                    <div className={`w-4 h-4 rounded-full ${
                        saveMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {saveMessage.text}
                </div>
            )}

            {/* Page Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-linear-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                        <ClipboardList className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Order Form
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Create custom form to collect order information from attendees
                        </p>
                    </div>
                </div>

                {/* Form Title and Description Inputs */}
                {!isLoading && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Form Title</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-lg font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                placeholder="Enter form title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Form Description (optional)</label>
                            <textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                placeholder="Enter form description"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSaveForm}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Form
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setPreviewMode(true)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-linear-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sections */}
            {isLoading ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-[#3D518C]" />
                    <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
                </div>
            ) : (
                <div className="space-y-6">
                {data.sections.map((section, sectionIndex) => (
                    <div
                        key={section.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                    >
                        {/* Section Header */}
                        <div className="p-6 border-b border-[#3D518C]/10 bg-linear-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    {editingSection === section.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-lg font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                placeholder="Section title"
                                            />
                                            <textarea
                                                value={section.description}
                                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                placeholder="Section description (optional)"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingSection(null)}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
                                                >
                                                    Done
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        deleteSection(section.id);
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                                >
                                                    Delete Section
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setEditingSection(section.id)}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                {section.title}
                                            </h2>
                                            {section.description && (
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70 mt-1">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section Inputs */}
                        <div className="p-6 space-y-4">
                            {section.inputs.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        No fields added yet
                                    </p>
                                    <button
                                        onClick={() => addInput(section.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Field
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {section.inputs.map((input) => (
                                        <div
                                            key={input.id}
                                            className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600 transition-all hover:border-[#3D518C]/30"
                                        >
                                            {editingInput === input.id ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Question</label>
                                                            <input
                                                                type="text"
                                                                value={input.question}
                                                                onChange={(e) => updateInput(section.id, input.id, { question: e.target.value })}
                                                                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                                placeholder="Enter question"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Input Type</label>
                                                            <select
                                                                value={input.type}
                                                                onChange={(e) => updateInput(section.id, input.id, { type: e.target.value as FormInput["type"] })}
                                                                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                            >
                                                                {INPUT_TYPES.map(type => (
                                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Field Identifier</label>
                                                            <select
                                                                value={input.fieldIdentifier}
                                                                onChange={(e) => updateInput(section.id, input.id, { fieldIdentifier: e.target.value })}
                                                                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                            >
                                                                {FIELD_IDENTIFIERS.map(field => (
                                                                    <option key={field.value} value={field.value}>{field.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {(input.type === "dropdown" || input.type === "checkboxes" || input.type === "multiple_choice" || input.type === "multiple_choice_grid" || input.type === "checkbox_grid") && (
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase mb-3 block">Options</label>
                                                            <div className="space-y-2">
                                                                {(input.options || []).map((option, idx) => (
                                                                    <div key={idx} className="flex gap-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={option}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(input.options || [])];
                                                                                newOptions[idx] = e.target.value;
                                                                                updateInput(section.id, input.id, { options: newOptions });
                                                                            }}
                                                                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                                            placeholder={`Option ${idx + 1}`}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newOptions = input.options?.filter((_, i) => i !== idx) || [];
                                                                                updateInput(section.id, input.id, { options: newOptions });
                                                                            }}
                                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                            title="Delete option"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newOptions = [...(input.options || []), ""];
                                                                        updateInput(section.id, input.id, { options: newOptions });
                                                                    }}
                                                                    className="w-full py-2 text-sm font-medium text-[#3D518C] dark:text-[#5C6BC0] border border-dashed border-[#3D518C]/30 dark:border-[#5C6BC0]/30 rounded-lg hover:bg-[#3D518C]/5 dark:hover:bg-[#5C6BC0]/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Option
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={input.required}
                                                                onChange={(e) => updateInput(section.id, input.id, { required: e.target.checked })}
                                                                className="w-4 h-4 rounded border-gray-300 text-[#3D518C] focus:ring-[#3D518C]"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Required</span>
                                                        </label>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingInput(null)}
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
                                                        >
                                                            Done
                                                        </button>
                                                        <button
                                                            onClick={() => deleteInput(section.id, input.id)}
                                                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => setEditingInput(input.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {input.question}
                                                                </p>
                                                                {input.required && (
                                                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                                                        Required
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <span>Type: <span className="font-medium">{INPUT_TYPES.find(t => t.value === input.type)?.label}</span></span>
                                                                <span>ID: <span className="font-medium">{input.fieldIdentifier}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    duplicateInput(section.id, input.id);
                                                                }}
                                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-[#5C6BC0] transition-colors"
                                                                title="Duplicate field"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => addInput(section.id)}
                                        className="w-full py-2.5 text-sm font-medium text-[#3D518C] dark:text-[#5C6BC0] border-2 border-dashed border-[#3D518C]/30 dark:border-[#5C6BC0]/30 rounded-lg hover:bg-[#3D518C]/5 dark:hover:bg-[#5C6BC0]/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Field
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                </div>
            )}

            {/* Add Section Button */}
            <button
                onClick={addSection}
                className="w-full py-3 text-sm font-semibold text-white bg-linear-to-r from-[#3D518C] to-[#5C6BC0] rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add New Section
            </button>
        </div>
    );
}
