"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import { layoutNavigationItems, getToggleableNavItems, type LayoutSettings } from "@/lib/constants";

export default function LayoutSettingsTab() {
  const [settings, setSettings] = useState<LayoutSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get toggleable nav items (non-locked pages)
  const toggleableItems = getToggleableNavItems();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/layout-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching layout settings:", error);
      toast.error("Failed to load layout settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: keyof LayoutSettings) => {
    try {
      setSaving(true);
      const newSettings = {
        ...settings,
        [field]: !settings[field],
      };

      const response = await fetch("/api/settings/layout-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: newSettings[field] }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setSettings(newSettings);
      
      // Update localStorage for instant load on refresh
      if (typeof window !== "undefined") {
        localStorage.setItem("layoutSettings", JSON.stringify(newSettings));
      }
      
      toast.success("Layout settings updated");

      // Trigger event to update sidebar immediately
      window.dispatchEvent(new CustomEvent("layoutSettingsUpdated"));
    } catch (error) {
      console.error("Error updating layout settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading layout settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Layout Settings</h2>
        <p className="text-gray-600">
          Customize which navigation items are visible in the sidebar.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Essential Navigation Items
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Dashboard, User Management, Settings, and Profile are essential items and cannot be disabled.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {layoutNavigationItems.map((item) => {
            const isVisible = item.locked || (item.settingsKey && settings[item.settingsKey as keyof LayoutSettings]);

            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {item.locked ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : isVisible ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>

                <div>
                  {item.locked ? (
                    <span className="text-sm text-gray-500 font-medium">
                      Always Visible
                    </span>
                  ) : (
                    <button
                      onClick={() => item.settingsKey && handleToggle(item.settingsKey as keyof LayoutSettings)}
                      disabled={saving || !item.settingsKey}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isVisible ? "bg-[#5B50E8]" : "bg-gray-200"
                      } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isVisible ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p className="font-medium mb-2">Note:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Changes take effect immediately after toggling</li>
          <li>Disabled items will be hidden from the sidebar navigation</li>
          <li>Essential items cannot be disabled for security and usability reasons</li>
          <li>Use the create-page.js script to add new toggleable pages</li>
        </ul>
      </div>
    </div>
  );
}
