import { useEffect, useState } from "react";
import { Eye, ImageIcon, Search, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReviewOrderModal from "../components/ReviewOrderModal";
import TablePaginationControls from "@/components/admin/TablePaginationControls";
import type { Order } from "../ManageOrdersClient";

interface FilterDropdownInlineProps {
    label: string;
    value: string;
    options: { value: string; label: string; color?: string }[];
    onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterDropdownInlineProps) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:border-[#3D518C] focus:ring-4 focus:ring-[#3D518C]/10 transition-all"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    );
}

interface ForReviewTabProps {
    orders: Order[];
    onConfirm: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

export default function ForReviewTab({ orders, onConfirm, onReject }: ForReviewTabProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        ticketType: "All",
        registrationType: "All",
    });
    const [tempFilters, setTempFilters] = useState({
        ticketType: "All",
        registrationType: "All",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filter only pending orders, then apply search + filters
    const pendingOrders = orders.filter((order) => order.status === "Pending");

    const ticketTypes = Array.from(new Set(pendingOrders.map(o => o.ticketType))).sort();

    const filteredOrders = pendingOrders.filter((order) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(searchLower) ||
            order.name.toLowerCase().includes(searchLower) ||
            order.email.toLowerCase().includes(searchLower);

        const matchesTicket = filters.ticketType === "All" || order.ticketType === filters.ticketType;
        const matchesRegType = filters.registrationType === "All" || order.registrationType === filters.registrationType;

        return matchesSearch && matchesTicket && matchesRegType;
    });

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filters.ticketType, filters.registrationType]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, filteredOrders.length, rowsPerPage]);

    const activeFiltersCount = [
        filters.ticketType !== "All",
        filters.registrationType !== "All",
    ].filter(Boolean).length;

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setFilters({ ticketType: "All", registrationType: "All" });
        setTempFilters({ ticketType: "All", registrationType: "All" });
        setShowFilters(false);
    };

    const handleOpenReview = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleNext = () => {
        if (!selectedOrder) return;
        const currentIndex = filteredOrders.findIndex((o) => o.id === selectedOrder.id);
        if (currentIndex < filteredOrders.length - 1) {
            setSelectedOrder(filteredOrders[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        if (!selectedOrder) return;
        const currentIndex = filteredOrders.findIndex((o) => o.id === selectedOrder.id);
        if (currentIndex > 0) {
            setSelectedOrder(filteredOrders[currentIndex - 1]);
        }
    };

    const currentIndex = selectedOrder ? filteredOrders.findIndex((o) => o.id === selectedOrder.id) : -1;
    const hasNext = currentIndex < filteredOrders.length - 1;
    const hasPrevious = currentIndex > 0;

    return (
        <>
            <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Name, or Email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (!showFilters) setTempFilters(filters);
                                setShowFilters(!showFilters);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0
                                ? "bg-[#3D518C] text-white border-[#3D518C] shadow-md"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                        >
                            <Filter size={16} />
                            Filters
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
                                Clear
                            </button>
                        )}
                    </div>
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
                            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-black/20 space-y-8 mb-4 relative z-20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <FilterSelect
                                        label="Registration Type"
                                        value={tempFilters.registrationType}
                                        onChange={(val) => setTempFilters({ ...tempFilters, registrationType: val })}
                                        options={[
                                            { value: "All", label: "All Types" },
                                            { value: "Individual", label: "Individual" },
                                            { value: "Group", label: "Group" },
                                        ]}
                                    />
                                    <FilterSelect
                                        label="Ticket Type"
                                        value={tempFilters.ticketType}
                                        onChange={(val) => setTempFilters({ ...tempFilters, ticketType: val })}
                                        options={[
                                            { value: "All", label: "All Tickets" },
                                            ...ticketTypes.map(type => ({ value: type, label: type })),
                                        ]}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-700/50">
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="px-8 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#3D518C]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pending Count */}
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {filteredOrders.length} pending {filteredOrders.length === 1 ? "order" : "orders"}
                    </p>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">
                                {pendingOrders.length === 0
                                    ? "No pending orders for review"
                                    : "No orders match your filters"
                                }
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                {pendingOrders.length === 0
                                    ? "All caught up! New registrations will appear here."
                                    : "Try adjusting your search or filter criteria."
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-blue-100 dark:bg-blue-900/30">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Registration Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Ticket Info
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Date Submitted
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Proof of Payment
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                                onClick={() => handleOpenReview(order)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {order.name}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {order.email}
                                                        </span>
                                                        <span className="text-xs text-gray-400 mt-1">ID: {order.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                                            {order.ticketType}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 w-fit mt-1">
                                                            {order.registrationType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                                            {order.date}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {order.time}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.proofOfPayment ? (
                                                        <div className="flex items-center gap-2 text-sm text-[#3D518C] dark:text-[#ABD2FA]">
                                                            <ImageIcon size={16} />
                                                            <span className="font-medium">View Image</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">No image</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenReview(order);
                                                        }}
                                                        className="p-2 hover:bg-[#3D518C]/10 text-[#3D518C] dark:text-[#ABD2FA] rounded-lg transition-colors"
                                                    >
                                                        <Eye size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <TablePaginationControls
                                totalItems={filteredOrders.length}
                                currentPage={currentPage}
                                rowsPerPage={rowsPerPage}
                                onPageChange={setCurrentPage}
                                onRowsPerPageChange={(rows) => {
                                    setRowsPerPage(rows);
                                    setCurrentPage(1);
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            <ReviewOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onConfirm={onConfirm}
                onReject={onReject}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
            />
        </>
    );
}
