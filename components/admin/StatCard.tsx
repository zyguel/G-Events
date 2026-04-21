import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    /** Optional growth label, e.g. "+18% vs 2024". Omit to show no trend row at all. */
    growth?: string;
    trend?: "up" | "down";
}

export default function StatCard({ title, value, growth, trend = "up" }: StatCardProps) {
    const hasGrowth = !!growth;
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-[140px] transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</div>
                {hasGrowth && (
                    <div className={`flex items-center text-xs mt-2 font-medium ${
                        trend === 'up'
                            ? 'text-green-500 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                    }`}>
                        {trend === 'up'
                            ? <ArrowUpRight size={14} className="mr-1 shrink-0" />
                            : <ArrowDownRight size={14} className="mr-1 shrink-0" />}
                        <span>{growth}</span>
                    </div>
                )}
            </div>
        </div>
    );
}