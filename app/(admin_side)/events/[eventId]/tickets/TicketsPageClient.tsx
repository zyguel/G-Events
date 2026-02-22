"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import AdmissionTab from "./tabs/AdmissionTab";
import AddOnsTab from "./tabs/AddOnsTab";
import PromoCodesTab from "./tabs/PromoCodesTab";
import SettingsTab from "./tabs/SettingsTab";
import { EventSummary } from "@/lib/types";

interface TicketsPageClientProps {
  event: EventSummary;
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
    <div className="max-w-5xl mx-auto p-8 space-y-6 pb-20 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
          <Ticket className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage admission tickets, add-ons, and promotional codes
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                ? "text-[#3D518C] dark:text-[#5C6BC0] border-b-2 border-[#3D518C] dark:border-[#5C6BC0] bg-[#3D518C]/5 dark:bg-[#3D518C]/10"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
