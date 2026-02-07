"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, X } from "lucide-react";

interface TimeInputProps {
    value: string; // Still stores in HH:mm (24-hour) format internally
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    openAbove?: boolean; // If true, picker opens above the input
}

export default function TimeInput({ value, onChange, placeholder, className, required, openAbove = false }: TimeInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Convert 24h value to 12h display string
    const to12HourDisplay = (val: string) => {
        if (!val) return '';
        const [h, m] = val.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return val;
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // Display value (12h format)
    const displayValue = to12HourDisplay(value);

    // Sync state with prop
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
                setSelectedHour(h % 12 || 12);
                setSelectedMinute(m);
            }
        }
    }, [value]);

    // Scroll to selected items when picker opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const hourEl = hourRef.current?.querySelector(`[data-value="${selectedHour}"]`);
                const minuteEl = minuteRef.current?.querySelector(`[data-value="${selectedMinute}"]`);
                if (hourEl && hourRef.current) {
                    hourRef.current.scrollTop = (hourEl as HTMLElement).offsetTop - 80;
                }
                if (minuteEl && minuteRef.current) {
                    minuteRef.current.scrollTop = (minuteEl as HTMLElement).offsetTop - 80;
                }
            }, 50);
        }
    }, [isOpen, selectedHour, selectedMinute]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const to24Hour = (h: number, m: number, p: 'AM' | 'PM') => {
        let hour = h;
        if (p === 'PM' && h !== 12) hour += 12;
        if (p === 'AM' && h === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleOk = () => {
        const timeStr = to24Hour(selectedHour, selectedMinute, selectedPeriod);
        onChange(timeStr);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
        // Reset picker to match current value
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
                setSelectedHour(h % 12 || 12);
                setSelectedMinute(m);
            }
        }
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className="relative" ref={containerRef}>
            {/* Input - now shows 12-hour format */}
            <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D518C] pointer-events-none" size={16} />
                <input
                    value={displayValue}
                    readOnly
                    onClick={() => setIsOpen(true)}
                    placeholder={placeholder || "Select time"}
                    className={`w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm cursor-pointer ${className}`}
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Picker */}
            {isOpen && (
                <div className={`absolute left-0 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-56 ${openAbove ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
                    {/* Header */}
                    <div className="bg-[#2196F3] px-4 py-3 flex items-center gap-3">
                        <Clock className="text-white/80" size={20} />
                        <div className="text-white text-2xl font-medium tracking-wide">
                            {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                        </div>
                        <X
                            className="ml-auto text-white/60 hover:text-white cursor-pointer"
                            size={20}
                            onClick={handleCancel}
                        />
                    </div>

                    {/* Columns */}
                    <div className="grid grid-cols-3 bg-white dark:bg-gray-800">
                        {/* Hours */}
                        <div
                            ref={hourRef}
                            className="h-52 overflow-y-auto"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    data-value={h}
                                    onClick={() => setSelectedHour(h)}
                                    className={`w-full py-3 text-center transition-all ${h === selectedHour
                                        ? 'text-xl font-bold text-indigo-500'
                                        : 'text-base text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* Minutes */}
                        <div
                            ref={minuteRef}
                            className="h-52 overflow-y-auto"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    data-value={m}
                                    onClick={() => setSelectedMinute(m)}
                                    className={`w-full py-3 text-center transition-all ${m === selectedMinute
                                        ? 'text-xl font-bold text-indigo-500'
                                        : 'text-base text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* AM/PM */}
                        <div className="h-52 flex flex-col justify-center items-center gap-3">
                            {(['AM', 'PM'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setSelectedPeriod(p)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${p === selectedPeriod
                                        ? 'text-indigo-500 text-lg'
                                        : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-sm font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg uppercase tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleOk}
                            className="px-3 py-1.5 text-sm font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg uppercase tracking-wide"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                div::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
