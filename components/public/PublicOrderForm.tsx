'use client';

import { Check } from 'lucide-react';
import type { FormInputField, OrderFormData } from '@/lib/types';

export type PublicFormAnswers = Record<string, string | string[] | null>;

export function PublicOrderForm({
  formData,
  answers,
  onAnswerChange,
  touched,
  validationErrors,
  fieldVisible = () => true,
}: {
  formData: OrderFormData;
  answers: PublicFormAnswers;
  onAnswerChange: (inputId: string, value: string | string[]) => void;
  touched: Set<string>;
  validationErrors: Record<string, string>;
  fieldVisible?: (input: FormInputField) => boolean;
}) {
  const renderInput = (input: FormInputField) => {
    const base =
      'w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3D518C]/30 focus:border-[#3D518C] dark:focus:border-blue-500 transition-all duration-200';
    const hasError = touched.has(input.id) && !!validationErrors[input.id];
    const errorClass = hasError
      ? 'border-red-300 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/30 focus:border-red-400'
      : '';
    const val = answers[input.id];

    switch (input.type) {
      case 'short_answer':
        return (
          <input
            id={`field-${input.id}`}
            type="text"
            className={`${base} ${errorClass}`}
            placeholder="Enter your response"
            value={(val as string) || ''}
            onChange={(e) => onAnswerChange(input.id, e.target.value)}
          />
        );
      case 'paragraph':
        return (
          <textarea
            id={`field-${input.id}`}
            className={`${base} ${errorClass} resize-none`}
            rows={4}
            placeholder="Enter your response..."
            value={(val as string) || ''}
            onChange={(e) => onAnswerChange(input.id, e.target.value)}
          />
        );
      case 'dropdown':
        return (
          <select
            id={`field-${input.id}`}
            className={`${base} ${errorClass}`}
            value={(val as string) || ''}
            onChange={(e) => onAnswerChange(input.id, e.target.value)}
          >
            <option value="">Select an option</option>
            {input.options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2.5">
            {input.options?.map((opt, i) => (
              <label
                key={i}
                className={`
                                flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                                ${val === opt
                    ? 'border-[#3D518C] bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                            `}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${val === opt ? 'border-[#3D518C] dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {val === opt && <div className="w-2 h-2 rounded-full bg-[#3D518C] dark:bg-blue-500" />}
                </div>
                <input
                  type="radio"
                  name={input.id}
                  value={opt}
                  checked={val === opt}
                  onChange={(e) => onAnswerChange(input.id, e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkboxes':
        return (
          <div className="space-y-2.5">
            {input.options?.map((opt, i) => {
              const selected = Array.isArray(val) ? val : [];
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={i}
                  className={`
                                    flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isChecked
                      ? 'border-[#3D518C] bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                                `}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'border-[#3D518C] bg-[#3D518C] dark:border-blue-500 dark:bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                  >
                    {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    value={opt}
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked ? selected.filter((v) => v !== opt) : [...selected, opt];
                      onAnswerChange(input.id, next);
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      case 'file_upload':
        return (
          <label
            className={`flex min-h-[44px] items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 py-8 hover:border-[#3D518C] ${hasError ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700/30`}
          >
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                {val ? (
                  <p className="text-sm font-semibold text-[#3D518C] dark:text-blue-400">{val as string}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">or drag and drop your file here</p>
                  </>
                )}
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAnswerChange(input.id, file.name);
              }}
            />
          </label>
        );
      case 'date':
        return (
          <input
            id={`field-${input.id}`}
            type="date"
            className={`${base} ${errorClass}`}
            value={(val as string) || ''}
            onChange={(e) => onAnswerChange(input.id, e.target.value)}
          />
        );
      case 'time':
        return (
          <input
            id={`field-${input.id}`}
            type="time"
            className={`${base} ${errorClass}`}
            value={(val as string) || ''}
            onChange={(e) => onAnswerChange(input.id, e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {formData.sections.map((section, sIdx) => {
        const visibleInputs = section.inputs.filter(fieldVisible);
        if (visibleInputs.length === 0) return null;

        return (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm"
          >
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/40 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-white text-xs font-bold">{sIdx + 1}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base break-words">{section.title}</h3>
                  {section.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{section.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {visibleInputs.map((input) => (
                <div key={input.id} className="space-y-2">
                  <label
                    htmlFor={`field-${input.id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200"
                  >
                    {input.question}
                    {input.required && <span className="text-red-500 text-base leading-none">*</span>}
                  </label>
                  {renderInput(input)}
                  {touched.has(input.id) && validationErrors[input.id] && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      {validationErrors[input.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
