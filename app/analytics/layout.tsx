import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Header/Navbar */}
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar activePage="analytics" />

                {/* Main Content Area */}
                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
