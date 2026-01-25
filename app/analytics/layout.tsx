import Header from "@/components/Header";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Header/Navbar */}
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar and Main Content handled by children */}
                {children}
            </div>
        </div>
    );
}
