import { useState } from "react";
import { Eye, ImageIcon } from "lucide-react";
import ReviewOrderModal from "../components/ReviewOrderModal";
import type { Order } from "../ManageOrdersClient";

interface ForReviewTabProps {
    orders: Order[];
    onConfirm: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

export default function ForReviewTab({ orders, onConfirm, onReject }: ForReviewTabProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter only pending orders
    const pendingOrders = orders.filter((order) => order.status === "Pending");

    const handleOpenReview = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleNext = () => {
        if (!selectedOrder) return;
        const currentIndex = pendingOrders.findIndex((o) => o.id === selectedOrder.id);
        if (currentIndex < pendingOrders.length - 1) {
            setSelectedOrder(pendingOrders[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        if (!selectedOrder) return;
        const currentIndex = pendingOrders.findIndex((o) => o.id === selectedOrder.id);
        if (currentIndex > 0) {
            setSelectedOrder(pendingOrders[currentIndex - 1]);
        }
    };

    const currentIndex = selectedOrder ? pendingOrders.findIndex((o) => o.id === selectedOrder.id) : -1;
    const hasNext = currentIndex < pendingOrders.length - 1;
    const hasPrevious = currentIndex > 0;

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {pendingOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No pending orders for review</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            All caught up! New registrations will appear here.
                        </p>
                    </div>
                ) : (
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
                                {pendingOrders.map((order) => (
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
                )}
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
