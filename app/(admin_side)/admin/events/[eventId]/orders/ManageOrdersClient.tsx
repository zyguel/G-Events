"use client";

import React, { useEffect, useState, useRef } from "react";

import { createPortal } from "react-dom";
import { Search, Filter, Plus, MoreVertical, Users, Trash2, CheckCircle, XCircle, ChevronDown, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useClick,
    useDismiss,
    useRole,
    useInteractions,
    FloatingFocusManager,
    FloatingPortal
} from "@floating-ui/react";

import ForReviewTab from "./tabs/ForReviewTab";
import { EventSummary } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import Modal, { ModalFooter } from "@/components/admin/Modal";
import TablePaginationControls from "@/components/admin/TablePaginationControls";

// Type for orders coming from the backend
export interface Order {
    id: string;
    name: string;
    email: string;
    ticketId: string;
    ticketType: string;

    registrationType: string;
    status: "Confirmed" | "Pending" | "Rejected";
    date: string;
    time: string;
    addOnStatus: string;
    proofOfPayment?: string | null;
    groupMemberEmails?: string[];
    ticketDeleted?: boolean;
    ticketPrice?: number;
    finalPricePaid?: number;
}

// Type for Filter options
interface FilterOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface FilterDropdownProps {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    placeholder?: string;
}

function FilterDropdown({ label, value, options, onChange, placeholder }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        placement: "bottom",
        strategy: "fixed"
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role,
    ]);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {label}
            </label>
            <button
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`flex items-center justify-between w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-sm transition-all duration-200 outline-none hover:shadow-sm ${isOpen
                    ? "border-[#3D518C] ring-4 ring-[#3D518C]/10 dark:ring-[#3D518C]/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.icon && (
                        <div className={`flex items-center justify-center ${selectedOption.color || "text-gray-400"}`}>
                            {selectedOption.icon}
                        </div>
                    )}
                    {selectedOption?.color && !selectedOption.icon && (
                        <div className={`w-2 h-2 rounded-full ${selectedOption.color}`} />
                    )}
                    <span className={`font-medium ${value === "All" ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <FloatingPortal>
                <AnimatePresence>
                    {isOpen && (
                        <FloatingFocusManager context={context} modal={false}>
                            <div
                                ref={refs.setFloating}
                                style={floatingStyles}
                                {...getFloatingProps()}
                                className="z-100"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="min-w-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden focus:outline-none"
                                >
                                    <div className="p-1.5 overflow-y-auto max-h-75 scrollbar-hide">
                                        {options.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onChange(option.value);
                                                    setIsOpen(false);
                                                }}
                                                className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-sm rounded-xl transition-all duration-150 ${value === option.value
                                                    ? "bg-[#3D518C] text-white shadow-md shadow-[#3D518C]/20"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                                    }`}
                                            >
                                                {option.icon && (
                                                    <div className={`flex items-center justify-center ${value === option.value ? "text-white" : (option.color || "text-gray-400")}`}>
                                                        {React.cloneElement(option.icon as React.ReactElement<any>, { size: 16 })}
                                                    </div>
                                                )}
                                                {option.color && !option.icon && (
                                                    <div className={`w-2 h-2 rounded-full ${value === option.value ? "bg-white" : option.color}`} />
                                                )}
                                                <span className="font-medium">{option.label}</span>
                                                {value === option.value && (
                                                    <CheckCircle size={14} className="ml-auto text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>

        </div>
    );
}

function AttendeeSearch({
    onSelect,
    onClear,
    selectedUser,
    label,
    placeholder = "Search by email or name..."
}: {
    onSelect: (user: { id: string, name: string, email: string }) => void;
    onClear: () => void;
    selectedUser: { id: string, name: string, email: string } | null;
    label: string;
    placeholder?: string;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ id: string, name: string, email: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(async () => {
            setIsSearching(true);
            try {
                const endpoint = query.trim()
                    ? `/api/users/search?q=${encodeURIComponent(query)}`
                    : '/api/users/search';
                const res = await fetch(endpoint);
                const json = await res.json();
                if (json.success) setResults(json.data || []);
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    if (selectedUser) {
        return (
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
                <div className="group relative p-4 bg-white dark:bg-gray-800/60 backdrop-blur-md border border-[#3D518C]/20 dark:border-blue-500/20 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-linear-to-br from-[#3D518C]/10 to-[#5C6BC0]/10 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-[#3D518C] dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{selectedUser.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClear}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                        <X size={16} />
                    </button>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 relative" ref={searchRef}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${query ? "text-[#3D518C] dark:text-blue-400" : "text-gray-400"}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        if (!query.trim()) {
                            setQuery('');
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-10 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl text-sm focus:border-[#3D518C] dark:focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium"
                />
                {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#3D518C]/20 border-t-[#3D518C] rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                        <div className="p-1.5 max-h-60 overflow-y-auto scrollbar-hide">
                            {results.length > 0 ? (
                                results.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            onSelect(user);
                                            setQuery("");
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-[#3D518C]/10 dark:group-hover:bg-blue-500/10 transition-colors">
                                            <User className="w-5 h-5 text-gray-400 group-hover:text-[#3D518C] dark:group-hover:text-blue-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#3D518C] dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-gray-400">No matching users found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AddOrderModal({
    isOpen,
    onClose,
    availableTickets,
    onSave,
    isSaving
}: {
    isOpen: boolean;
    onClose: () => void;
    availableTickets: any[];
    onSave: (data: { registrationType: "Individual" | "Group", ticketId: string, attendees: { name: string, email: string }[] }) => Promise<{ success: boolean, error?: string }>;
    isSaving: boolean;
}) {
    const [registrationType, setRegistrationType] = useState<"Individual" | "Group">("Individual");
    const [ticketId, setTicketId] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<({ id: string, name: string, email: string } | null)[]>([null]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setRegistrationType("Individual");
            setTicketId(availableTickets[0]?.id?.toString() || "");
            setSelectedUsers([null]);
            setError(null);
        }
    }, [isOpen, availableTickets]);

    const addUserSlot = () => setSelectedUsers([...selectedUsers, null]);

    const removeUserSlot = (index: number) => {
        if (selectedUsers.length > 1) {
            setSelectedUsers(selectedUsers.filter((_, i) => i !== index));
        }
    };

    const setUser = (index: number, user: { id: string, name: string, email: string } | null) => {
        const newUsers = [...selectedUsers];
        newUsers[index] = user;
        setSelectedUsers(newUsers);
    };

    const isValid = ticketId && selectedUsers.every(u => u !== null);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Register New Attendee"
            size="md"
            bodyClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3"
                    >
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-red-800 dark:text-red-300">Registration Error</p>
                            <p className="text-xs text-red-600 dark:text-red-400/80 mt-1 leading-relaxed">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}

                {/* Header Section */}
                <div className="space-y-4">
                    {/* Registration Type Select - PREMIUM SEGMENTED CONTROL */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Registration Mode</label>
                        <div className="relative flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-[22px] isolate overflow-hidden">
                            {(["Individual", "Group"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setRegistrationType(type);
                                        if (type === "Individual" && selectedUsers.length > 1) {
                                            setSelectedUsers([selectedUsers[0]]);
                                        }
                                    }}
                                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-all duration-500 rounded-2xl ${registrationType === type
                                        ? "text-[#3D518C] dark:text-blue-400"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {type === "Individual" ? <User size={14} /> : <Users size={14} />}
                                        {type}
                                    </div>
                                    {registrationType === type && (
                                        <motion.div
                                            className="absolute inset-0 bg-white dark:bg-gray-700/80 shadow-sm border border-[#3D518C]/10 dark:border-blue-500/10 rounded-2xl -z-10"
                                            initial={false}
                                            animate={{ x: 0 }}
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Selection - PREMIUM GRID */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ticket Assignment</label>
                        <div className="grid grid-cols-1 gap-2.5">
                            {availableTickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setTicketId(String(ticket.id))}
                                    className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${String(ticket.id) === ticketId
                                        ? "border-[#3D518C] bg-[#3D518C]/5 dark:bg-blue-500/10 dark:border-blue-500/50 shadow-md shadow-[#3D518C]/5"
                                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-800/40"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${String(ticket.id) === ticketId ? "bg-[#3D518C] scale-125 shadow-[0_0_8px_rgba(61,81,140,0.5)]" : "bg-gray-300 dark:bg-gray-600"}`} />
                                        <div className="flex flex-col items-start">
                                            <p className={`text-sm font-bold uppercase transition-colors ${String(ticket.id) === ticketId ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                                {ticket.name}
                                            </p>
                                            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                {ticket.price === 0 ? 'COMPLIMENTARY' : `PHP ${ticket.price}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 ${String(ticket.id) === ticketId ? "bg-[#3D518C] text-white" : "bg-gray-50 dark:bg-gray-700 text-transparent"}`}>
                                        <CheckCircle size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Attendee Details - PREMIUM SEARCHABLE LIST */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registrant(s)</label>
                        {registrationType === "Group" && (
                            <button
                                onClick={addUserSlot}
                                className="flex items-center gap-2 text-[10px] font-black text-[#3D518C] dark:text-blue-400 uppercase tracking-widest hover:opacity-70 transition-opacity"
                            >
                                <Plus size={14} /> Add Attendee
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {selectedUsers.map((user, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    {registrationType === "Group" && index > 0 && !user && (
                                        <button
                                            onClick={() => removeUserSlot(index)}
                                            className="absolute -top-3 -right-3 z-20 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500 shadow-xl rounded-full transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <AttendeeSearch
                                        label={index === 0 ? "Primary Registrant" : `Additional Attendee #${index}`}
                                        placeholder={`Search by email to add${index === 0 ? " first" : " more"} registrant...`}
                                        selectedUser={user}
                                        onSelect={(u) => setUser(index, u)}
                                        onClear={() => setUser(index, null)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <ModalFooter
                onCancel={onClose}
                onSave={async () => {
                    setError(null);
                    const attendees = selectedUsers.filter(u => u !== null).map(u => ({ name: u!.name, email: u!.email }));
                    const result = await onSave({ registrationType, ticketId, attendees });
                    if (!result.success) {
                        setError(result.error || "An unexpected error occurred. Please try again.");
                    }
                }}
                isSubmitting={isSaving}
                saveText={registrationType === "Group" ? `Confirm Group (${selectedUsers.length})` : "Confirm Registration"}
                submitType="button"
                disableSave={!isValid}
            />
        </Modal>
    );
}


function EditOrderModal({
    isOpen,
    onClose,
    order,
    availableTickets,
    onSave,
    isSaving
}: {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    availableTickets: any[];
    onSave: (orderId: string, ticketId: string) => void;
    isSaving: boolean;
}) {
    const [selectedTicketId, setSelectedTicketId] = useState("");

    useEffect(() => {
        if (order) setSelectedTicketId(order.ticketId);
    }, [order]);

    const isChanged = order ? selectedTicketId !== order.ticketId : false;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Order"
            subtitle={order ? `Order #${order.id}` : undefined}
            size="md"
            bodyClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-7">
                {/* Attendee Info Card */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800/70 dark:via-gray-800/50 dark:to-gray-800/70">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-[#3D518C]/5 to-transparent rounded-bl-full" />
                    <div className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#3D518C] to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#3D518C]/20 shrink-0">
                            {order?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{order?.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${order?.status === "Confirmed"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : order?.status === "Rejected"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            }`}>
                            {order?.status}
                        </span>
                    </div>
                    <div className="px-5 pb-4 flex gap-6">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Ticket</p>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{order?.ticketType}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</p>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{order?.registrationType}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered</p>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{order?.date}</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Assign New Ticket
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                        {availableTickets.map((ticket) => {
                            const isSelected = String(ticket.id) === selectedTicketId;
                            const isCurrent = order ? String(ticket.id) === order.ticketId : false;
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(String(ticket.id))}
                                    className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                        ? "border-[#3D518C] bg-[#3D518C]/5 dark:bg-blue-500/10 dark:border-blue-500/50 shadow-md shadow-[#3D518C]/5"
                                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-800/40"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isSelected ? "bg-[#3D518C] scale-125 shadow-[0_0_8px_rgba(61,81,140,0.5)]" : "bg-gray-300 dark:bg-gray-600"}`} />
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-bold uppercase transition-colors ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                                    {ticket.name}
                                                </p>
                                                {isCurrent && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                {ticket.price === 0 ? 'COMPLIMENTARY' : `PHP ${ticket.price}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 ${isSelected ? "bg-[#3D518C] text-white" : "bg-gray-50 dark:bg-gray-700 text-transparent"}`}>
                                        <CheckCircle size={14} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ModalFooter
                onCancel={onClose}
                onSave={() => order && onSave(order.id, selectedTicketId)}
                isSubmitting={isSaving}
                saveText={isChanged ? "Save Changes" : "No Changes"}
                submitType="button"
                disableSave={!selectedTicketId || !isChanged}
            />
        </Modal>
    );
}







interface ManageOrdersClientProps {


    event: EventSummary;
}

export default function ManageOrdersClient({ event }: ManageOrdersClientProps) {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<"all" | "review">("all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [availableTickets, setAvailableTickets] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddingOrder, setIsAddingOrder] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
    const [isSaving, setIsSaving] = useState(false);


    const [appliedFilters, setAppliedFilters] = useState({
        status: "All",
        ticketType: "All",
        registrationType: "All"
    });
    const [tempFilters, setTempFilters] = useState({
        status: "All",
        ticketType: "All",
        registrationType: "All"
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [allOrdersPage, setAllOrdersPage] = useState(1);
    const [allOrdersRowsPerPage, setAllOrdersRowsPerPage] = useState(10);


    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Load orders from backend for real events
    useEffect(() => {
        const controller = new AbortController();

        const loadOrders = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`/api/events/${event.id}/orders`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    throw new Error(`Failed to load orders (${res.status})`);
                }
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setOrders(json.data);
                } else {
                    throw new Error(json?.error || "Unexpected response format");
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") return;
                console.error("Error loading orders:", e);
                setError(e instanceof Error ? e.message : "Failed to load orders");
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();

        // Load available tickets
        const loadTickets = async () => {
            try {
                const res = await fetch(`/api/events/${event.id}/tickets`);
                const json = await res.json();
                if (json?.success) {
                    setAvailableTickets(json.data || []);
                }
            } catch (err) {
                console.error("Error loading tickets:", err);
            }
        };
        loadTickets();

        return () => controller.abort();
    }, [event.id]);


    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuId(null);
            setMenuPosition(null);
        };
        const handleCloseOnScroll = () => {
            if (activeMenuId) {
                setActiveMenuId(null);
                setMenuPosition(null);
            }
        };

        if (activeMenuId) {
            window.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", handleCloseOnScroll, true);
            window.addEventListener("resize", handleCloseOnScroll);
        }
        return () => {
            window.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", handleCloseOnScroll, true);
            window.removeEventListener("resize", handleCloseOnScroll);
        };
    }, [activeMenuId]);

    // Extract unique ticket types from orders
    const ticketTypes = Array.from(new Set(orders.map(o => o.ticketType))).sort();

    // Filter orders based on search query and applied filters
    const filteredOrders = orders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            order.id.toLowerCase().includes(searchLower) ||
            order.name.toLowerCase().includes(searchLower) ||
            order.email.toLowerCase().includes(searchLower)
        );

        const matchesStatus = appliedFilters.status === "All" || order.status === appliedFilters.status;
        const matchesTicket = appliedFilters.ticketType === "All" || order.ticketType === appliedFilters.ticketType;
        const matchesRegType = appliedFilters.registrationType === "All" || order.registrationType === appliedFilters.registrationType;

        return matchesSearch && matchesStatus && matchesTicket && matchesRegType;
    });

    const paginatedOrders = filteredOrders.slice(
        (allOrdersPage - 1) * allOrdersRowsPerPage,
        allOrdersPage * allOrdersRowsPerPage
    );



    useEffect(() => {
        setAllOrdersPage(1);
    }, [searchQuery, appliedFilters.status, appliedFilters.ticketType, appliedFilters.registrationType]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / allOrdersRowsPerPage));
        if (allOrdersPage > totalPages) {
            setAllOrdersPage(totalPages);
        }
    }, [allOrdersPage, allOrdersRowsPerPage, filteredOrders.length]);

    const activeFiltersCount = [
        appliedFilters.status !== "All",
        appliedFilters.ticketType !== "All",
        appliedFilters.registrationType !== "All"
    ].filter(Boolean).length;

    const handleApplyFilters = () => {
        setAppliedFilters(tempFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setAppliedFilters({
            status: "All",
            ticketType: "All",
            registrationType: "All"
        });
        setTempFilters({
            status: "All",
            ticketType: "All",
            registrationType: "All"
        });
        setShowFilters(false);
    };


    const handleConfirmOrder = async (orderId: string) => {
        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, status: "Confirmed" } : order
            )
        );

        if (event.id.startsWith("evt-")) return;

        try {
            const res = await fetch(`/api/events/${event.id}/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "confirm" }),
            });
            if (!res.ok) {
                throw new Error(`Failed to confirm order (${res.status})`);
            }
        } catch (e) {
            console.error("Error confirming order:", e);
            // Roll back optimistic change if needed
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: "Pending" } : order
                )
            );
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, status: "Rejected" } : order
            )
        );

        if (event.id.startsWith("evt-")) return;

        try {
            const res = await fetch(`/api/events/${event.id}/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject" }),
            });
            if (!res.ok) {
                throw new Error(`Failed to reject order (${res.status})`);
            }
        } catch (e) {
            console.error("Error rejecting order:", e);
            // Roll back optimistic change if needed
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: "Pending" } : order
                )
            );
        }
    };

    const handleUpdateOrder = async (orderId: string, newTicketId: string) => {


        const selectedTicket = availableTickets.find(t => String(t.id) === newTicketId);
        if (!selectedTicket) return;

        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, ticketId: newTicketId, ticketType: selectedTicket.name } : order
            )
        );

        setIsSaving(true);
        try {
            const res = await fetch(`/api/events/${event.id}/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", ticketId: newTicketId }),
            });
            if (!res.ok) throw new Error("Failed to update order");
            setIsEditModalOpen(false);
            setOrderToEdit(null);
        } catch (e) {
            console.error("Error updating order:", e);
            setError("Failed to update order. Please try again.");
            // Refresh orders on error to sync back
            window.location.reload();
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddOrder = async (data: { registrationType: "Individual" | "Group", ticketId: string, attendees: { name: string, email: string }[] }) => {
        setIsAddingOrder(true);
        // We don't set the global error here anymore
        try {
            const res = await fetch(`/api/events/${event.id}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) {
                return { success: false, error: json.error || "Failed to add registration" };
            }

            if (json.success && Array.isArray(json.data)) {
                setOrders(prev => [...json.data, ...prev]);
            }
            setIsAddModalOpen(false);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message || "Network error occurred" };
        } finally {
            setIsAddingOrder(false);
        }
    };

    const handleDeleteOrder = async () => {

        if (!orderToDelete) return;
        const orderId = orderToDelete.id;

        // Optimistic update
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);

        if (event.id.startsWith("evt-")) return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/events/${event.id}/orders/${orderId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                throw new Error(`Failed to delete order (${res.status})`);
            }
        } catch (e) {
            console.error("Error deleting order:", e);
            setError(e instanceof Error ? e.message : "Failed to delete order");
            window.location.reload();
        } finally {
            setIsDeleting(false);
        }
    };




    return (
        <>
            <div className="p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-linear-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('Manage Orders')}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {t('View and manage event registrations')}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            onClick={() => setActiveTab("review")}
                            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "review"
                                ? "text-[#3D518C] dark:text-[#ABD2FA]"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            {t('For Review')}
                            {activeTab === "review" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "all"
                                ? "text-[#3D518C] dark:text-[#ABD2FA]"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            {t('All Orders')}
                            {activeTab === "all" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>

                    </div>

                    {/* Error / loading states */}
                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* All Orders Tab Content */}
                    {activeTab === "all" && (
                        <div className="space-y-6">
                            {/* Action Bar */}
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 max-w-md">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={t('Search by Order ID, Name, or Email')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* Filter Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                if (!showFilters) {
                                                    setTempFilters(appliedFilters);
                                                }
                                                setShowFilters(!showFilters);
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0
                                                ? "bg-[#3D518C] text-white border-[#3D518C] shadow-md"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            <Filter size={16} />
                                            {t('Filters')}
                                            {activeFiltersCount > 0 && (
                                                <span className="flex items-center justify-center w-5 h-5 bg-white text-[#3D518C] rounded-full text-[10px] font-bold">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </button>
                                        {(activeFiltersCount > 0 || searchQuery) && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                            >
                                                <X size={16} />
                                                {t('Clear')}
                                            </button>
                                        )}
                                    </div>
                                </div>


                                {/* Add Order Button */}
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                                >
                                    <Plus size={18} />
                                    {t('Add Order')}
                                </button>
                            </div>

                            {/* Filter Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-black/20 space-y-8 mb-8 mt-2 relative z-20">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                                {/* Status Filter */}
                                                <FilterDropdown
                                                    label={t('Registration Status')}
                                                    value={tempFilters.status}
                                                    onChange={(val) => setTempFilters({ ...tempFilters, status: val })}
                                                    options={[
                                                        { value: "All", label: t('All Statuses') },
                                                        { value: "Confirmed", label: t('Confirmed'), color: "bg-green-500" },
                                                        { value: "Pending", label: t('Pending'), color: "bg-yellow-500" },
                                                        { value: "Rejected", label: t('Rejected'), color: "bg-red-500" },
                                                    ]}
                                                />

                                                {/* Registration Type Filter */}
                                                <FilterDropdown
                                                    label={t('Registration Type')}
                                                    value={tempFilters.registrationType}
                                                    onChange={(val) => setTempFilters({ ...tempFilters, registrationType: val })}
                                                    options={[
                                                        { value: "All", label: t('All Types') },
                                                        { value: "Individual", label: t('Individual') },
                                                        { value: "Group", label: t('Group') },
                                                    ]}
                                                />


                                                {/* Ticket Type Filter */}
                                                <FilterDropdown
                                                    label={t('Ticket Type')}
                                                    value={tempFilters.ticketType}
                                                    onChange={(val) => setTempFilters({ ...tempFilters, ticketType: val })}
                                                    options={[
                                                        { value: "All", label: t('All Tickets') },
                                                        ...ticketTypes.map(type => ({
                                                            value: type,
                                                            label: type
                                                        }))
                                                    ]}
                                                />
                                            </div>

                                            <div className="flex justify-end gap-3 mt-8 pt-8 border-t border-gray-100 dark:border-gray-700/50">
                                                <button
                                                    onClick={() => setShowFilters(false)}
                                                    className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                >
                                                    {t('Cancel')}
                                                </button>
                                                <button
                                                    onClick={handleApplyFilters}
                                                    className="px-8 py-2.5 bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#3D518C]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    {t('Apply Filters')}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>



                            {/* Orders Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                {isLoading ? (
                                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {t('Loading orders...')}
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-blue-100 dark:bg-blue-900/30">
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Registration ID
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Email
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Ticket Type
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Registration Type
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Registration Status
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Registration Date
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Registration Time
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Add-On Status
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {paginatedOrders.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                                                                {order.id}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                                <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                                                    {order.email}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.ticketType}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.registrationType}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span
                                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "Confirmed"
                                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                                                        }`}
                                                                >
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.date}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.time}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {order.addOnStatus}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right relative ${activeMenuId === order.id ? 'z-50' : 'z-auto'}`}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (activeMenuId === order.id) {
                                                                            setActiveMenuId(null);
                                                                            setMenuPosition(null);
                                                                        } else {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setMenuPosition({
                                                                                top: rect.bottom + 4,
                                                                                left: rect.right - 192,
                                                                            });
                                                                            setActiveMenuId(order.id);
                                                                        }
                                                                    }}
                                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                                                >
                                                                    <MoreVertical size={16} className="text-gray-400" />
                                                                </button>

                                                                {activeMenuId === order.id && menuPosition && typeof document !== 'undefined' && createPortal(
                                                                    <div
                                                                        style={{
                                                                            position: 'fixed',
                                                                            top: menuPosition.top,
                                                                            left: menuPosition.left,
                                                                        }}
                                                                        className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-100 overflow-hidden animate-fade-in"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="p-1.5">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOrderToEdit(order);
                                                                                    setIsEditModalOpen(true);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                                                            >
                                                                                <Plus size={16} className="text-blue-500" />
                                                                                Edit Order
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOrderToDelete(order);
                                                                                    setIsDeleteModalOpen(true);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                                Delete Order
                                                                            </button>
                                                                        </div>
                                                                    </div>,
                                                                    document.body
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <TablePaginationControls
                                            totalItems={filteredOrders.length}
                                            currentPage={allOrdersPage}
                                            rowsPerPage={allOrdersRowsPerPage}
                                            onPageChange={setAllOrdersPage}
                                            onRowsPerPageChange={(rows) => {
                                                setAllOrdersRowsPerPage(rows);
                                                setAllOrdersPage(1);
                                            }}
                                        />

                                        {/* Empty State */}
                                        {filteredOrders.length === 0 && !isLoading && (
                                            <div className="text-center py-12">
                                                <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                    Try adjusting your search query
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* For Review Tab Content */}
                    {activeTab === "review" && (
                        <ForReviewTab
                            orders={orders}
                            onConfirm={handleConfirmOrder}
                            onReject={handleRejectOrder}
                        />
                    )}


                </div>
            </div>

            {/* Edit Order Modal */}
            <EditOrderModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setOrderToEdit(null);
                }}
                order={orderToEdit}
                availableTickets={availableTickets}
                onSave={handleUpdateOrder}
                isSaving={isSaving}
            />

            {/* Add Order Modal */}
            <AddOrderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                availableTickets={availableTickets}
                onSave={handleAddOrder}
                isSaving={isAddingOrder}
            />



            {/* Delete Confirmation Modal */}


            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title={t('Delete Registration')}
                subtitle={t('This action cannot be undone')}
                size="sm"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
                            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                                {t('Are you sure you want to delete this registration?')}
                            </p>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                                {t('Registration ID')}: {orderToDelete?.id}<br />
                                {t('Name')}: {orderToDelete?.name}
                            </p>
                        </div>
                    </div>

                    <ModalFooter
                        onCancel={() => setIsDeleteModalOpen(false)}
                        onSave={handleDeleteOrder}
                        saveText={t('Delete Registration')}
                        cancelText={t('Cancel')}
                        isDanger={true}
                        isSubmitting={isDeleting}
                        submitType="button"
                    />
                </div>
            </Modal>
        </>
    );
}
