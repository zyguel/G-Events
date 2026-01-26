import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    growth: string;
    trend: "up" | "down";
}

export default function StatCard({ title, value, growth, trend }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-[140px] transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</div>
                <div className={`flex items-center text-xs mt-2 font-medium ${trend === 'up' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
                    <span>{growth}</span>
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">from last month</span>
                </div>
            </div>
        </div>
    );
}