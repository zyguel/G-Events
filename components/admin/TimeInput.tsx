"use client";

import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Clock } from "lucide-react";

interface TimeInputProps {
    value: string; // Still stores in HH:mm (24-hour) format internally
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export default function TimeInput({ value, onChange, placeholder, className, required }: TimeInputProps) {
    const handleChange = (newValue: string | null) => {
        if (newValue) {
            onChange(newValue);
        }
    };

    return (
        <div className="time-input-wrapper">
            <style jsx global>{`
                /* Container styling */
                .react-time-picker {
                    width: 100%;
                }
                .react-time-picker__wrapper {
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 8px 12px;
                    background-color: white;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dark .react-time-picker__wrapper {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                .react-time-picker__wrapper:hover {
                    border-color: #a5b4fc;
                }
                .react-time-picker__wrapper:focus-within {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                
                /* Input fields */
                .react-time-picker__inputGroup {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                    padding-left: 28px;
                }
                .react-time-picker__inputGroup__input {
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    color: #111827;
                    font-size: 14px;
                    padding: 0 !important;
                    min-width: 0 !important;
                    text-align: center;
                }
                .dark .react-time-picker__inputGroup__input {
                    color: #f3f4f6;
                }
                .react-time-picker__inputGroup__divider {
                    color: #6b7280;
                }
                .dark .react-time-picker__inputGroup__divider {
                    color: #9ca3af;
                }
                .react-time-picker__inputGroup__leadingZero {
                    color: #9ca3af;
                }
                
                /* Clock icon button */
                .react-time-picker__clock-button {
                    display: none !important;
                }
                
                /* Clear button */
                .react-time-picker__clear-button {
                    display: none !important;
                }
                
                /* Clock dropdown */
                .react-time-picker__clock {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 8px;
                    z-index: 9999;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    padding: 16px;
                }
                .dark .react-time-picker__clock {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                
                /* Clock face */
                .react-clock {
                    border: none !important;
                }
                .react-clock__face {
                    border: 2px solid #e5e7eb;
                }
                .dark .react-clock__face {
                    border-color: #374151;
                }
                .react-clock__hand__body {
                    background-color: #6366f1 !important;
                }
                .react-clock__mark__body {
                    background-color: #d1d5db;
                }
                .dark .react-clock__mark__body {
                    background-color: #4b5563;
                }
                .react-clock__mark__number {
                    color: #374151;
                    font-size: 12px;
                }
                .dark .react-clock__mark__number {
                    color: #d1d5db;
                }
                .react-clock__second-hand__body {
                    background-color: #ef4444 !important;
                }
                
                /* Custom clock icon */
                .time-input-wrapper {
                    position: relative;
                }
                .time-input-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    z-index: 10;
                }
            `}</style>

            <div className="relative">
                <Clock
                    className="time-input-icon text-indigo-500"
                    size={16}
                />
                <TimePicker
                    onChange={handleChange}
                    value={value || null}
                    disableClock={false}
                    format="h:mm a"
                    clearIcon={null}
                    clockIcon={null}
                    className={className}
                />
            </div>
        </div>
    );
}
