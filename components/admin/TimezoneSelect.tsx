"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
}

const TIMEZONES = [
  { code: "Asia/Manila", label: "Asia/Manila (PHT, UTC+8)" },
  { code: "Asia/Hong_Kong", label: "Asia/Hong_Kong (HKT, UTC+8)" },
  { code: "Asia/Shanghai", label: "Asia/Shanghai (CST, UTC+8)" },
  { code: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { code: "Asia/Bangkok", label: "Asia/Bangkok (ICT, UTC+7)" },
  { code: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { code: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { code: "Asia/Seoul", label: "Asia/Seoul (KST, UTC+9)" },
  { code: "Australia/Sydney", label: "Australia/Sydney (AEDT, UTC+11)" },
  { code: "Pacific/Auckland", label: "Pacific/Auckland (NZDT, UTC+13)" },
  { code: "UTC", label: "UTC (UTC+0)" },
  { code: "Europe/London", label: "Europe/London (GMT/BST, UTC+0/+1)" },
  { code: "Europe/Paris", label: "Europe/Paris (CET/CEST, UTC+1/+2)" },
  { code: "America/New_York", label: "America/New_York (EST/EDT, UTC-5/-4)" },
  { code: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT, UTC-8/-7)" },
  { code: "America/Chicago", label: "America/Chicago (CST/CDT, UTC-6/-5)" },
];

export default function TimezoneSelect({ value, onChange, label }: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedTimezone = TIMEZONES.find(t => t.code === value);
  const filtered = TIMEZONES.filter(t =>
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        type="button"
      >
        <span className="text-gray-900 dark:text-white">
          {selectedTimezone ? selectedTimezone.code : "Select timezone"}
        </span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-300 dark:border-gray-600">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search timezone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((timezone) => (
              <button
                key={timezone.code}
                onClick={() => {
                  onChange(timezone.code);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                type="button"
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                  value === timezone.code ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{timezone.code}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{timezone.label.split(" (")[1]?.replace(")", "")}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
