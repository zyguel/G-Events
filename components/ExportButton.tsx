"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, FileDown, Check } from "lucide-react";
import { exportToCSV, exportToXLSX, exportToPDF } from "@/lib/exportUtils";

// Type for the data that can be exported
interface ExportableData {
    name: string;
    stats: {
        totalEvents: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
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

    const handleExport = (format: ExportFormat) => {
        try {
            switch (format) {
                case 'csv':
                    exportToCSV(data);
                    break;
                case 'xlsx':
                    exportToXLSX(data);
                    break;
                case 'pdf':
                    exportToPDF(data);
                    break;
            }
            setExportedFormat(format);
            setTimeout(() => setIsOpen(false), 500);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const exportOptions = [
        {
            format: 'xlsx' as ExportFormat,
            label: 'Excel (.xlsx)',
            icon: FileSpreadsheet,
            description: 'Spreadsheet with multiple sheets',
        },
        {
            format: 'pdf' as ExportFormat,
            label: 'PDF Document',
            icon: FileText,
            description: 'Formatted report document',
        },
        {
            format: 'csv' as ExportFormat,
            label: 'CSV File',
            icon: FileDown,
            description: 'Simple comma-separated values',
        },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Export Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <Download size={16} />
                Export
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Export Format
                        </p>
                        {exportOptions.map((option) => {
                            const Icon = option.icon;
                            const isExported = exportedFormat === option.format;

                            return (
                                <button
                                    key={option.format}
                                    onClick={() => handleExport(option.format)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${isExported
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                                        }`}>
                                        {isExported ? (
                                            <Check size={16} className="text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Icon size={16} className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${isExported
                                            ? 'text-green-700 dark:text-green-400'
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {isExported ? 'Downloaded!' : option.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {option.description}
                                        </p>
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
