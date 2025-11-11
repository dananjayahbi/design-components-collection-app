"use client";

import { Sparkles, Image } from 'lucide-react';

export type TabType = 'quotes' | 'backgrounds';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8">
        <button
          onClick={() => onTabChange('quotes')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'quotes'
              ? 'border-[#5B50E8] text-[#5B50E8]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quotes Generator
          </span>
        </button>
        <button
          onClick={() => onTabChange('backgrounds')}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'backgrounds'
              ? 'border-[#5B50E8] text-[#5B50E8]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Background Generator
          </span>
        </button>
      </nav>
    </div>
  );
}
