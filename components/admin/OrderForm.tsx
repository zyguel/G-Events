"use client";

import { useState } from "react";
import { Trash2, Plus, Copy, Eye, EyeOff, ClipboardList } from "lucide-react";

interface FormInput {
    id: string;
    question: string;
    type: "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio" | "date";
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
    { value: "text", label: "Short Text" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Long Text" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkboxes" },
    { value: "radio", label: "Multiple Choice" },
    { value: "date", label: "Date" }
];

export default function OrderForm({ eventId }: { eventId: string }) {
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
                        type: "text",
                        fieldIdentifier: "full_name",
                        required: true
                    }
                ]
            }
        ]
    });

    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editingInput, setEditingInput] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

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
            type: "text",
            fieldIdentifier: `field_${Date.now()}`,
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
            case "textarea":
                return <textarea className={baseClasses} placeholder="Your answer" rows={3} disabled />;
            case "select":
                return (
                    <select className={baseClasses} disabled>
                        <option>Select an option</option>
                        {input.options?.map((opt, idx) => (
                            <option key={idx}>{opt}</option>
                        ))}
                    </select>
                );
            case "checkbox":
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
            case "radio":
                return (
                    <div className="space-y-2">
                        {input.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" className="w-4 h-4" disabled />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case "date":
                return <input type="date" className={baseClasses} disabled />;
            case "email":
                return <input type="email" className={baseClasses} placeholder="your@email.com" disabled />;
            case "number":
                return <input type="number" className={baseClasses} placeholder="0" disabled />;
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
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                            <ClipboardList className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Order Forms
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Create custom forms to collect order information from attendees
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setPreviewMode(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </button>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {data.sections.map((section, sectionIndex) => (
                    <div
                        key={section.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                    >
                        {/* Section Header */}
                        <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
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
                                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
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
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
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
                                                            <input
                                                                type="text"
                                                                value={input.fieldIdentifier}
                                                                onChange={(e) => updateInput(section.id, input.id, { fieldIdentifier: e.target.value })}
                                                                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                                placeholder="e.g., full_name"
                                                            />
                                                        </div>
                                                    </div>

                                                    {(input.type === "select" || input.type === "checkbox" || input.type === "radio") && (
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Options (one per line)</label>
                                                            <textarea
                                                                value={input.options?.join("\n") || ""}
                                                                onChange={(e) => updateInput(section.id, input.id, { options: e.target.value.split("\n").filter(o => o.trim()) })}
                                                                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                                                rows={3}
                                                            />
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
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] rounded-lg hover:shadow-lg transition-all"
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

            {/* Add Section Button */}
            <button
                onClick={addSection}
                className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add New Section
            </button>
        </div>
    );
}
