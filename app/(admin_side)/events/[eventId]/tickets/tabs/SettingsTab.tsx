"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getEventSettings, updateEventSettings, EventSettings } from "@/lib/eventManagement";
import { EventSummary } from "@/lib/types";

interface SettingsTabProps {
  event: EventSummary;
}

export default function SettingsTab({ event }: SettingsTabProps) {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getEventSettings(event.id);
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDisplay = async (key: keyof EventSettings) => {
    if (!settings) return;

    const newValue = !settings[key as keyof EventSettings];
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);

    setSaving(true);
    try {
      await updateEventSettings(event.id, { [key]: newValue });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = (message: string) => {
    if (!settings) return;
    setSettings({ ...settings, messageAfterSalesEnd: message });
  };

  const handleSaveMessage = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateEventSettings(event.id, { messageAfterSalesEnd: settings.messageAfterSalesEnd });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D518C]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {saved && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm font-medium">
          Settings saved successfully
        </div>
      )}



      {/* Display Tickets Remaining */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Display Remaining Ticket Count</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Show attendees how many tickets are available
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.displayTicketsRemaining}
              onChange={() => handleToggleDisplay("displayTicketsRemaining")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3D518C] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#3D518C]"></div>
          </label>
        </div>
      </div>

      {/* Display Message After Sales End */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Display Message After Ticket Sales End</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Show a custom message when ticket sales have concluded
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.displayMessageAfterSalesEnd}
              onChange={() => handleToggleDisplay("displayMessageAfterSalesEnd")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3D518C] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#3D518C]"></div>
          </label>
        </div>

        {settings.displayMessageAfterSalesEnd && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={settings.messageAfterSalesEnd}
                onChange={(e) => handleUpdateMessage(e.target.value)}
                onBlur={handleSaveMessage}
                maxLength={2500}
                disabled={saving}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] disabled:opacity-50"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Max 2,500 characters</p>
                <p className={`text-xs font-medium ${settings.messageAfterSalesEnd.length >= 2400
                  ? "text-red-600"
                  : settings.messageAfterSalesEnd.length >= 2000
                    ? "text-amber-600"
                    : "text-gray-500"
                  }`}>
                  {settings.messageAfterSalesEnd.length}/2,500
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message Preview</h4>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {settings.messageAfterSalesEnd || "Your message will appear here..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Clock size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Timeline</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Before sales start:</strong> Ticket count and message hidden</li>
              <li>• <strong>During sales:</strong> Remaining count displayed if enabled</li>
              <li>• <strong>After sales end:</strong> Message displayed if enabled</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
