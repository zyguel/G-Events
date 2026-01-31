"use client";

import { useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import AdmissionTab from "./tabs/AdmissionTab";
import AddOnsTab from "./tabs/AddOnsTab";
import PromoCodesTab from "./tabs/PromoCodesTab";
import SettingsTab from "./tabs/SettingsTab";

interface TicketsPageClientProps {
  event: {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
  };
}

type Tab = "admission" | "addons" | "promo" | "settings";

const tabs: { id: Tab; label: string }[] = [
  { id: "admission", label: "Admission" },
  { id: "addons", label: "Add-ons" },
  { id: "promo", label: "Promo-codes" },
  { id: "settings", label: "Settings" },
];

export default function TicketsPageClient({ event }: TicketsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("admission");

  const renderTabContent = () => {
    switch (activeTab) {
      case "admission":
        return <AdmissionTab event={event} />;
      case "addons":
        return <AddOnsTab event={event} />;
      case "promo":
        return <PromoCodesTab event={event} />;
      case "settings":
        return <SettingsTab event={event} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage="events" disableExpand={true} />

        <div className="ml-20 hidden lg:block h-full flex-shrink-0">
          <EventsSidebar event={event} activePage="tickets" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {/* Sticky Tab Navigation */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <div className="p-8">
              <h1 className="text-4xl font-bold mb-8">Tickets</h1>

              {/* Tab Buttons */}
              <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 font-medium text-base transition-colors duration-200 border-b-2 ${
                      activeTab === tab.id
                        ? "border-[#3D518C] text-[#3D518C] dark:text-[#3D518C]"
                        : "border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
