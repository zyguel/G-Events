"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Filter, Plus, MoreVertical, Users, Trash2, CheckCircle, XCircle } from "lucide-react";
import ForReviewTab from "./tabs/ForReviewTab";
import { EventSummary } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import Modal, { ModalFooter } from "@/components/admin/Modal";

// Type for orders coming from the backend
export interface Order {
    id: string;
    name: string;
    email: string;
    ticketType: string;
    registrationType: string;
    status: "Confirmed" | "Pending" | "Rejected";
    date: string;
    time: string;
    addOnStatus: string;
    proofOfPayment?: string | null;
    groupMemberEmails?: string[];
}

// Fallback mock data for local/demo events
const initialMockOrders: Order[] = [
    {
        id: "20240502000002",
        name: "Karylle Bernate",
        email: "karyllebernate8@gmail.com",
        ticketType: "General Admission",
        registrationType: "Individual",
        status: "Confirmed",
        date: "May 18, 2025",
        time: "8:01 PM",
        addOnStatus: "Claimed",
        proofOfPayment: "https://placehold.co/600x400/png",
        groupMemberEmails: [],
    },
    {
        id: "20240502000001",
        name: "Vinz Villarin",
        email: "vinzvillarin@gmail.com",
        ticketType: "Premium Admission",
        registrationType: "Group",
        status: "Confirmed",
        date: "May 18, 2025",
        time: "8:01 PM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x400/png",
        groupMemberEmails: ["vinzvillarin@gmail.com", "sophiavillarin@gmail.com"],
    },
    {
        id: "20240502000003",
        name: "Sophia Villarin",
        email: "sophiavillarin@gmail.com",
        ticketType: "Premium Admission",
        registrationType: "Group",
        status: "Confirmed",
        date: "May 18, 2025",
        time: "8:01 PM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x400/png",
        groupMemberEmails: ["vinzvillarin@gmail.com", "sophiavillarin@gmail.com"],
    },
    {
        id: "20240502000004",
        name: "John Doe",
        email: "johndoe@gmail.com",
        ticketType: "General Admission",
        registrationType: "Individual",
        status: "Pending",
        date: "May 19, 2025",
        time: "10:30 AM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x800/png?text=Proof+of+Payment+1"
    },
    {
        id: "20240502000005",
        name: "Jane Smith",
        email: "janesmith@gmail.com",
        ticketType: "Premium Admission",
        registrationType: "Individual",
        status: "Confirmed",
        date: "May 19, 2025",
        time: "2:15 PM",
        addOnStatus: "Claimed",
        proofOfPayment: "https://placehold.co/600x400/png"
    },
    {
        id: "20240502000006",
        name: "Mark Johnson",
        email: "markjohnson@gmail.com",
        ticketType: "General Admission",
        registrationType: "Group",
        status: "Confirmed",
        date: "May 20, 2025",
        time: "11:45 AM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x400/png"
    },
    {
        id: "20240502000007",
        name: "Sarah Williams",
        email: "sarahw@gmail.com",
        ticketType: "VIP Access",
        registrationType: "Individual",
        status: "Pending",
        date: "May 21, 2025",
        time: "09:15 AM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x800/png?text=Proof+of+Payment+2"
    },
    {
        id: "20240502000008",
        name: "Mike Brown",
        email: "mikeb@gmail.com",
        ticketType: "General Admission",
        registrationType: "Individual",
        status: "Pending",
        date: "May 21, 2025",
        time: "01:30 PM",
        addOnStatus: "Unclaimed",
        proofOfPayment: "https://placehold.co/600x800/png?text=Proof+of+Payment+3"
    }
];

interface ManageOrdersClientProps {
    event: EventSummary;
}

export default function ManageOrdersClient({ event }: ManageOrdersClientProps) {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<"all" | "review">("all");
    const [orders, setOrders] = useState<Order[]>(event.id.startsWith("evt-") ? initialMockOrders : []);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(!event.id.startsWith("evt-"));
    const [error, setError] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Load orders from backend for real events
    useEffect(() => {
        if (event.id.startsWith("evt-")) {
            setIsLoading(false);
            return;
        }

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

    // Filter orders based on search query
    const filteredOrders = orders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        return (
            order.id.toLowerCase().includes(searchLower) ||
            order.name.toLowerCase().includes(searchLower) ||
            order.email.toLowerCase().includes(searchLower)
        );
    });

    const handleClearFilters = () => {
        setSearchQuery("");
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
            // Note: In a real app, you might want to re-fetch the orders to restore the deleted one if it failed
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
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
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                        >
                                            <Filter size={16} />
                                            {t('Apply Filter')}
                                        </button>
                                        <button
                                            onClick={handleClearFilters}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                        >
                                            {t('Clear Filters')}
                                        </button>
                                    </div>
                                </div>

                                {/* Add Order Button */}
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                                    <Plus size={18} />
                                    {t('Add Order')}
                                </button>
                            </div>

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
                                            {filteredOrders.map((order) => (
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
                                                                    top: `${menuPosition.top}px`,
                                                                    left: `${menuPosition.left}px`,
                                                                }}
                                                                className="w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="py-1">
                                                                    {order.status === "Pending" && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleConfirmOrder(order.id);
                                                                                    setActiveMenuId(null);
                                                                                    setMenuPosition(null);
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                                            >
                                                                                <CheckCircle size={16} />
                                                                                Confirm Registration
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleRejectOrder(order.id);
                                                                                    setActiveMenuId(null);
                                                                                    setMenuPosition(null);
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                                                                            >
                                                                                <XCircle size={16} />
                                                                                Reject Registration
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            setOrderToDelete(order);
                                                                            setIsDeleteModalOpen(true);
                                                                            setActiveMenuId(null);
                                                                            setMenuPosition(null);
                                                                        }}
                                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
            </main>

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
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
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
        </div>
    );
}
