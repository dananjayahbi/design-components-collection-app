"use client";

import { DashboardLayout } from '@/components/layout';
import { ProtectedPage } from '@/components/wrappers/auth';
import { useState } from 'react';
import { TabNavigation, SavedQuotes, BackgroundsView, TabType } from './components';

export default function ViewContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('quotes');

  return (
    <ProtectedPage>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Content</h1>
            <p className="text-gray-600 mt-2">Browse and manage your saved quotes and backgrounds</p>
          </div>

          {/* Tabs */}
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'quotes' ? <SavedQuotes /> : <BackgroundsView />}
        </div>
      </DashboardLayout>
    </ProtectedPage>
  );
}