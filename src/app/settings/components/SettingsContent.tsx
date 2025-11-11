"use client";

import { useState } from 'react';
import { SettingsTabNavigation } from './SettingsTabNavigation';
import { TextModelsTab } from './TextModelsTab';
import { ImageModelsTab } from './ImageModelsTab';
import { ImageSettingsTab } from './ImageSettingsTab';
import LayoutSettingsTab from './LayoutSettingsTab';
import { DataExportTab } from './DataExportTab';

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState('text-models');

  return (
    <div className="space-y-6">
      <SettingsTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'text-models' && <TextModelsTab />}
        {activeTab === 'image-models' && <ImageModelsTab />}
        {activeTab === 'image-settings' && <ImageSettingsTab />}
        {activeTab === 'layout-settings' && <LayoutSettingsTab />}
        {activeTab === 'data-export' && <DataExportTab />}
      </div>
    </div>
  );
}
