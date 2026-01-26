"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Clock } from "lucide-react";
import { forwardRef } from "react";

interface TimeInputProps {
    value: string; // HH:mm format (24-hour)
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

// Custom input component to match DateTimeInput design
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, className }, ref) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <Clock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none transition-colors"
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

export default function TimeInput({ value, onChange, placeholder, className, required }: TimeInputProps) {
    // Convert string time to Date object for the picker
    const timeToDate = (timeStr: string): Date | null => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    };

    // Convert Date object back to HH:mm string
    const dateToTime = (date: Date | null): string => {
        if (!date) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleChange = (date: Date | null) => {
        onChange(dateToTime(date));
    };

    return (
        <div className="time-input-wrapper">
            <style jsx global>{`
                .react-datepicker--time-only {
                    font-family: inherit;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .dark .react-datepicker--time-only {
                    background-color: #1f2937;
                    border-color: #374151;
                    color: #f3f4f6;
                }
                .react-datepicker--time-only .react-datepicker__time-container {
                    border-left: none;
                    width: 100%;
                }
                .react-datepicker--time-only .react-datepicker__time {
                    background-color: white;
                }
                .dark .react-datepicker--time-only .react-datepicker__time {
                    background-color: #1f2937;
                }
                .react-datepicker--time-only .react-datepicker__header {
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 8px;
                    border-radius: 12px 12px 0 0;
                }
                .dark .react-datepicker--time-only .react-datepicker__header {
                    background-color: #111827;
                    border-color: #374151;
                }
                .react-datepicker__time-list-item:hover {
                    background-color: #f3f4f6 !important;
                }
                .dark .react-datepicker__time-list-item:hover {
                    background-color: #374151 !important;
                }
                .react-datepicker__time-list-item--selected {
                    background-color: #3b82f6 !important;
                    color: white !important;
                }
                .react-datepicker__time-list {
                    max-height: 120px !important;
                    overflow-y: auto !important;
                }
            `}</style>
            <DatePicker
                selected={timeToDate(value)}
                onChange={handleChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeInputLabel="Time:"
                showTimeInput
                dateFormat="h:mm aa"
                placeholderText={placeholder || "Select time"}
                customInput={<CustomInput className={className} />}
                calendarClassName="shadow-xl"
                popperPlacement="bottom"
            />
        </div>
    );
}
