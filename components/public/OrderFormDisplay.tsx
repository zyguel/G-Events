// components/public/OrderFormDisplay.tsx
'use client';

import { useState, useCallback } from 'react';
import { OrderFormData, FormInputField, FormInputType } from '@/lib/types';
import { useOrderFormSubmit } from '@/lib/hooks/useOrderFormSubmit';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface OrderFormDisplayProps {
    formData: OrderFormData;
    eventId: number;
    orderFormId: number;
    userEmail?: string;
    registrationId?: number;
    onSuccess?: () => void;
}

interface FormAnswers {
    [inputId: string]: string | string[] | null;
}

export default function OrderFormDisplay({
    formData,
    eventId,
    orderFormId,
    userEmail,
    registrationId,
    onSuccess
}: OrderFormDisplayProps) {
    const [answers, setAnswers] = useState<FormAnswers>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());

    const { isSubmitting, error, success, successMessage, submit } = useOrderFormSubmit({
        eventId,
        orderFormId,
        userEmail,
        registrationId
    });

    const handleInputChange = useCallback((inputId: string, value: string | string[]) => {
        setAnswers(prev => ({
            ...prev,
            [inputId]: value
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all as touched for validation
        const allInputIds = new Set<string>();
        formData.sections.forEach(section => {
            section.inputs.forEach(input => {
                allInputIds.add(input.id);
            });
        });
        setTouched(allInputIds);

        // Validate required fields
        const requiredFields = formData.sections.flatMap(s =>
            s.inputs.filter(i => i.required)
        );

        for (const field of requiredFields) {
            const value = answers[field.id];
            if (!value) {
                // setError would be from the submit function in the hook
                return;
            }
        }

        await submit(formData, answers);
        if (onSuccess) onSuccess();
    }, [formData, answers, submit, onSuccess]);

    const renderInput = (input: FormInputField) => {
        const baseClasses = "w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent";
        const value = answers[input.id];

        switch (input.type) {
            case 'short_answer':
                return (
                    <input
                        type="text"
                        className={baseClasses}
                        placeholder={`Enter ${input.question.toLowerCase()}`}
                        value={value || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        required={input.required}
                    />
                );

            case 'paragraph':
                return (
                    <textarea
                        className={baseClasses}
                        placeholder="Enter your response"
                        rows={4}
                        value={value || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        required={input.required}
                    />
                );

            case 'dropdown':
                return (
                    <select
                        className={baseClasses}
                        value={value || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        required={input.required}
                    >
                        <option value="">Select an option</option>
                        {input.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case 'multiple_choice':
                return (
                    <div className="space-y-2">
                        {input.options?.map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={input.id}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                                    required={input.required}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkboxes':
                return (
                    <div className="space-y-2">
                        {input.options?.map((opt, idx) => {
                            const selectedValues = Array.isArray(value) ? value : [];
                            return (
                                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={opt}
                                        checked={selectedValues.includes(opt)}
                                        onChange={(e) => {
                                            const newValues = selectedValues.includes(opt)
                                                ? selectedValues.filter(v => v !== opt)
                                                : [...selectedValues, opt];
                                            handleInputChange(input.id, newValues);
                                        }}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'file_upload':
                return (
                    <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#3D518C] transition-colors bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex flex-col items-center gap-2">
                            <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Click to upload file or drag here
                            </span>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleInputChange(input.id, file.name);
                                }
                            }}
                            required={input.required}
                        />
                    </label>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        className={baseClasses}
                        value={value || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        required={input.required}
                    />
                );

            case 'time':
                return (
                    <input
                        type="time"
                        className={baseClasses}
                        value={value || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        required={input.required}
                    />
                );

            case 'multiple_choice_grid':
            case 'checkbox_grid':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left p-3 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"></th>
                                    {input.options?.map((opt, idx) => (
                                        <th
                                            key={idx}
                                            className="p-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-center border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        >
                                            {opt}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {['Row 1', 'Row 2', 'Row 3'].map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 font-medium">
                                            {row}
                                        </td>
                                        {input.options?.map((opt, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className="p-3 text-center border border-gray-200 dark:border-gray-600"
                                            >
                                                <input
                                                    type={input.type === 'multiple_choice_grid' ? 'radio' : 'checkbox'}
                                                    name={input.type === 'multiple_choice_grid' ? `${input.id}-${rowIdx}` : undefined}
                                                    value={`${row}|${opt}`}
                                                    onChange={(e) => {
                                                        const selectedValues = Array.isArray(value) ? value : [];
                                                        const newValue = e.target.value;
                                                        if (e.target.type === 'checkbox') {
                                                            if (selectedValues.includes(newValue)) {
                                                                handleInputChange(
                                                                    input.id,
                                                                    selectedValues.filter(v => v !== newValue)
                                                                );
                                                            } else {
                                                                handleInputChange(input.id, [...selectedValues, newValue]);
                                                            }
                                                        } else {
                                                            handleInputChange(input.id, newValue);
                                                        }
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Form Submitted Successfully!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-200">
                    {successMessage || 'Thank you for completing the form.'}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
                </div>
            )}

            {formData.sections.map((section) => (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                        {section.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{section.description}</p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {section.inputs.map((input) => (
                            <div key={input.id} className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {input.question}
                                    {input.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderInput(input)}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Form'
                )}
            </button>
        </form>
    );
}
