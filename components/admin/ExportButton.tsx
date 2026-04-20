"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, FileType, Table2, FileDown, Check } from "lucide-react";
import { exportToCSV, exportToXLSX, exportToPDF } from "@/lib/exportUtils";

// Type for the data that can be exported
interface ExportableData {
    name: string;
    stats: {
        totalEvents?: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
    demographics?: {
        totalResponses: number;
        fields: {
            identifier: string;
            label: string;
            distribution: { value: string; count: number }[];
        }[];
    };
    trends?: {
        attendance?: {
            checkedIn: number;
            noShow: number;
            waitlisted: number;
        };
    };
    comments?: {
        user: string;
        rating: number;
        text: string;
        time: string;
    }[];
}

interface ExportButtonProps {
    data: ExportableData;
}

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

export default function ExportButton({ data }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exportedFormat, setExportedFormat] = useState<ExportFormat | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Clear success indicator after timeout
    useEffect(() => {
        if (exportedFormat) {
            const timer = setTimeout(() => setExportedFormat(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [exportedFormat]);

    const handleExport = async (format: ExportFormat) => {
        try {
            switch (format) {
                case 'csv':
                    exportToCSV(data);
                    break;
                case 'xlsx':
                    await exportToXLSX(data);
                    break;
                case 'pdf':
                    await exportToPDF(data);
                    break;
            }
            setExportedFormat(format);
            setTimeout(() => setIsOpen(false), 500);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const exportOptions = [
        { format: 'xlsx' as ExportFormat, label: 'Excel (.xlsx)', desc: 'Spreadsheet with multiple sheets', icon: FileSpreadsheet, color: 'emerald' },
        { format: 'pdf' as ExportFormat, label: 'PDF Document', desc: 'Formatted report document', icon: FileType, color: 'red' },
        { format: 'csv' as ExportFormat, label: 'CSV File', desc: 'Simple comma-separated values', icon: Table2, color: 'blue' },
    ];

    const colorClasses: Record<string, { bg: string; icon: string }> = {
        emerald: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: 'text-emerald-600 dark:text-emerald-400',
        },
        red: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            icon: 'text-red-600 dark:text-red-400',
        },
        blue: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            icon: 'text-blue-600 dark:text-blue-400',
        },
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
                <Download size={16} />
                Export
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 min-w-[240px] overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Export Format</p>
                    </div>
                    <div className="py-1">
                        {exportOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isExported = exportedFormat === opt.format;
                            const classes = colorClasses[opt.color] || colorClasses.blue;
                            return (
                                <button
                                    key={opt.format}
                                    onClick={() => handleExport(opt.format as ExportFormat)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExported
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : classes.bg
                                        }`}>
                                        {isExported ? (
                                            <Check size={16} className="text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Icon size={16} className={classes.icon} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${isExported
                                            ? 'text-green-700 dark:text-green-400'
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {isExported ? 'Downloaded!' : opt.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
