"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { forwardRef } from "react";

interface DateInputProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    className?: string;
}

// Custom input component to match DateTimeInput design
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, className }, ref) => (
    <div className="relative group cursor-pointer w-full" onClick={onClick}>
        <Calendar
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D518C] z-10 pointer-events-none transition-colors"
            size={16}
        />
        <input
            ref={ref}
            value={value}
            readOnly
            placeholder={placeholder}
            className={`w-full pl-10 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-300 font-sans ${className}`}
        />
    </div>
));

CustomInput.displayName = "CustomInput";

export default function DateInput({ value, onChange, placeholder, className }: DateInputProps) {
    return (
        <div className="date-input-wrapper">
            <style jsx global>{`
                .react-datepicker-wrapper {
                    width: 100%;
                    display: block;
                }
                .react-datepicker__input-container {
                    display: block;
                    width: 100%;
                }
                .react-datepicker {
                    font-family: inherit;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    z-index: 9999 !important;
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
                    color: #111827;
                }
                .dark .react-datepicker__day {
                    color: #f3f4f6;
                }
                .react-datepicker__day:hover {
                    background-color: #f3f4f6;
                }
                .dark .react-datepicker__day:hover {
                    background-color: #374151;
                }
                .react-datepicker__day--selected {
                    background-color: #6366f1 !important;
                    color: white !important;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #818cf8;
                    color: white;
                }
                .react-datepicker__day--today {
                    font-weight: bold;
                    color: #6366f1;
                }
                .dark .react-datepicker__day--today {
                    color: #818cf8;
                }
                .react-datepicker__day--outside-month {
                    color: #9ca3af;
                }
                .dark .react-datepicker__day--outside-month {
                    color: #6b7280;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: #6b7280;
                }
                .dark .react-datepicker__navigation-icon::before {
                    border-color: #9ca3af;
                }
                .react-datepicker__navigation:hover *::before {
                    border-color: #111827;
                }
                .dark .react-datepicker__navigation:hover *::before {
                    border-color: #f3f4f6;
                }
                .react-datepicker__triangle {
                    display: none;
                }
                .react-datepicker__navigation {
                    top: 12px;
                }
                .react-datepicker__navigation--previous {
                    left: 12px;
                }
                .react-datepicker__navigation--next {
                    right: 12px;
                }
                .react-datepicker__month {
                    margin: 0.4em;
                }
                .dark .react-datepicker__month {
                    background-color: #1f2937;
                }
            `}</style>
            <DatePicker
                selected={value}
                onChange={onChange}
                dateFormat="MM/dd/yyyy"
                placeholderText={placeholder || "Select date"}
                customInput={<CustomInput className={className} />}
                calendarClassName="shadow-xl"
                popperClassName="!z-[9999]"
            />
        </div>
    );
}
