"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, X } from "lucide-react";
import { useFloating, autoUpdate, offset, shift } from "@floating-ui/react";

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

    const { refs, floatingStyles } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: openAbove ? "top-start" : "bottom-start",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(4),
            shift({ padding: 8 })
        ]
    });

    const [pickerWidth, setPickerWidth] = useState<number>(160);

    // Sync input width for the floating element minimum width
    useEffect(() => {
        if (refs.reference.current) {
            const rect = (refs.reference.current as HTMLElement).getBoundingClientRect();
            setPickerWidth(Math.max(rect.width, 160));
        }
    }, [isOpen, refs.reference]);

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
            const target = e.target as Node;
            const clickedInsideContainer = (refs.reference.current as HTMLElement | null)?.contains(target);
            const clickedInsidePicker = refs.floating.current?.contains(target as Node);
            if (!clickedInsideContainer && !clickedInsidePicker) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, refs]);

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
        <div className="relative" ref={refs.setReference}>
            {/* Input - now shows 12-hour format */}
            <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D518C] pointer-events-none" size={16} />
                <input
                    value={displayValue}
                    readOnly
                    onClick={() => setIsOpen(true)}
                    placeholder={placeholder || "Select time"}
                    className={`w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#3D518C]/20 focus:border-[#3D518C] outline-none shadow-sm cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-all ${className}`}
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

            {/* Picker - rendered inline to stay within modal frame */}
            {isOpen && (
                <div
                    ref={refs.setFloating}
                    className="absolute z-50 bg-white dark:bg-gray-800 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 overflow-hidden font-sans"
                    style={{ ...floatingStyles, width: `${pickerWidth}px` }}
                >
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
                        <div className="flex items-center gap-1.5">
                            <Clock className="text-gray-400" size={14} />
                            <div className="text-gray-900 dark:text-white text-sm font-bold tracking-wide">
                                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                            </div>
                        </div>
                        <X
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                            size={14}
                            onClick={handleCancel}
                        />
                    </div>

                    {/* Columns */}
                    <div className="grid grid-cols-[1fr_1fr_min-content] bg-white dark:bg-gray-800 h-40">
                        {/* Hours */}
                        <div
                            ref={hourRef}
                            className="overflow-y-auto px-1 py-1 border-r border-gray-50 dark:border-gray-700/50"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    data-value={h}
                                    onClick={() => setSelectedHour(h)}
                                    className={`w-full py-1.5 text-center rounded-lg transition-colors ${h === selectedHour
                                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs'
                                        : 'text-gray-600 hover:bg-gray-50 text-xs font-medium'
                                        }`}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* Minutes */}
                        <div
                            ref={minuteRef}
                            className="overflow-y-auto px-1 py-1"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    data-value={m}
                                    onClick={() => setSelectedMinute(m)}
                                    className={`w-full py-1.5 text-center rounded-lg transition-colors ${m === selectedMinute
                                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs'
                                        : 'text-gray-600 hover:bg-gray-50 text-xs font-medium'
                                        }`}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* AM/PM */}
                        <div className="flex flex-col justify-center items-center gap-2 px-2 border-l border-gray-50 dark:border-gray-700/50">
                            {(['AM', 'PM'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setSelectedPeriod(p)}
                                    className={`w-8 py-1 rounded-md text-[11px] font-bold transition-all ${p === selectedPeriod
                                        ? 'border border-[#E0E7FF] text-[#4F46E5] bg-white'
                                        : 'text-gray-500 hover:text-gray-700 border border-transparent'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-2 py-2 border-t border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-800 gap-1">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleOk}
                            className="px-3 py-1.5 text-[11px] font-semibold bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors shadow-sm"
                        >
                            Confirm
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
