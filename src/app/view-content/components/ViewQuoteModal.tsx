"use client";

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ViewQuoteModalProps {
  quote: string;
  tone: string;
  onClose: () => void;
}

export function ViewQuoteModal({ quote, tone, onClose }: ViewQuoteModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quote Details</h2>

        <div className="bg-linear-to-br from-[#5B50E8]/10 to-purple-50 p-8 rounded-lg border-l-4 border-[#5B50E8]">
          <p className="text-xl text-gray-900 italic leading-relaxed mb-4">
            "{quote}"
          </p>
          
          {tone && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Tone:</span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-[#5B50E8]/10 text-[#5B50E8] capitalize">
                {tone}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
