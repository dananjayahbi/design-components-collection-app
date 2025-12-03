"use client";

import { useState } from 'react';
import { SettingsTabNavigation } from './SettingsTabNavigation';
import LayoutSettingsTab from './LayoutSettingsTab';
import { DataExportTab } from './DataExportTab';

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState('layout-settings');

  return (
    <div className="space-y-6">
      <SettingsTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'layout-settings' && <LayoutSettingsTab />}
        {activeTab === 'data-export' && <DataExportTab />}
      </div>
    </div>
  );
}
