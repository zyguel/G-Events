"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { forwardRef } from "react";

interface DateTimeInputProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    className?: string;
}

// Custom input component to match the authorized design
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, className }, ref) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <Calendar
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none transition-colors"
            size={18}
        />
        <input
            ref={ref}
            value={value}
            readOnly
            placeholder={placeholder}
            className={`w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-300 font-sans ${className}`}
        />
    </div>
));

CustomInput.displayName = "CustomInput";

export default function DateTimeInput({ value, onChange, placeholder, className }: DateTimeInputProps) {
    return (
        <div className="datetime-input-wrapper">
            <style jsx global>{`
                .react-datepicker-wrapper {
                    width: 100%;
                }
                .react-datepicker {
                    font-family: inherit;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }
                .dark .react-datepicker {
                    background-color: #1f2937;
                    border-color: #374151;
                    color: #f3f4f6;
                }
                .react-datepicker__header {
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    padding-top: 12px;
                }
                .dark .react-datepicker__header {
                    background-color: #111827;
                    border-color: #374151;
                }
                .react-datepicker__current-month {
                    font-weight: 600;
                    color: #111827;
                }
                .dark .react-datepicker__current-month {
                    color: #f3f4f6;
                }
                .react-datepicker__day-name {
                    color: #6b7280;
                }
                .dark .react-datepicker__day-name {
                    color: #9ca3af;
                }
                .react-datepicker__day {
                    border-radius: 6px;
                    margin: 0.166rem;
                }
                .react-datepicker__day:hover {
                    background-color: #f3f4f6;
                }
                .dark .react-datepicker__day:hover {
                    background-color: #374151;
                }
                .react-datepicker__day--selected {
                    background-color: #3b82f6 !important;
                    color: white !important;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #60a5fa;
                }
                .react-datepicker__time-container {
                    border-left: 1px solid #e5e7eb;
                }
                .dark .react-datepicker__time-container {
                    border-color: #374151;
                }
                .react-datepicker__time-container .react-datepicker__time {
                    background-color: white;
                }
                .dark .react-datepicker__time-container .react-datepicker__time {
                    background-color: #1f2937;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
                    background-color: #f3f4f6;
                }
                .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
                    background-color: #374151;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                    background-color: #3b82f6 !important;
                    color: white !important;
                }
            `}</style>
            <DatePicker
                selected={value}
                onChange={onChange}
                showTimeSelect
                dateFormat="MM/dd/yyyy h:mm aa"
                placeholderText={placeholder || "Select date and time"}
                customInput={<CustomInput className={className} />}
                calendarClassName="shadow-xl"
            />
        </div>
    );
}
