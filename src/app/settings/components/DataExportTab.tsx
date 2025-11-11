"use client";

import toast from 'react-hot-toast';
import { Download } from 'lucide-react';

export function DataExportTab() {
  const handleDownloadQuotes = async () => {
    try {
      const response = await fetch('/api/quotes/download');

      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-quotes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Quote sheet downloaded');
    } catch (error) {
      toast.error('Failed to download quote sheet');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
        
        <div className="flex items-start gap-4">
          <button
            onClick={handleDownloadQuotes}
            className="px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Quote Sheet
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Generated Quotes CSV</p>
            <p className="text-sm text-gray-600">
              Download all generated quotes as a CSV file. The file includes timestamps, quote text, model used, and all optional parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
