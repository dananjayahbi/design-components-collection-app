"use client";

import { Lock } from "lucide-react";
import { layoutNavigationItems } from "@/lib/constants";

export default function LayoutSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Layout Settings</h2>
        <p className="text-gray-600">
          View the navigation items in the sidebar.
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
              All navigation items are essential and always visible.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {layoutNavigationItems.map((item) => {
            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500 font-medium">
                    Always Visible
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p className="font-medium mb-2">Note:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>All items are essential navigation items</li>
          <li>Add new toggleable items by updating the layoutNavigation.ts file</li>
        </ul>
      </div>
    </div>
  );
}
