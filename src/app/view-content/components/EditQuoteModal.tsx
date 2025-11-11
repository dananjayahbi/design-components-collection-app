"use client";

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface EditQuoteModalProps {
  rowId: number;
  initialQuote: string;
  onClose: () => void;
  onSave: () => void;
}

export function EditQuoteModal({ rowId, initialQuote, onClose, onSave }: EditQuoteModalProps) {
  const [quote, setQuote] = useState(initialQuote);
  const [isSaving, setIsSaving] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!quote.trim()) {
      toast.error('Quote cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/quotes/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, quote }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update quote');
        return;
      }

      toast.success('Quote updated successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('An error occurred while updating quote');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Quote</h2>

        <div className="mb-6">
          <label htmlFor="quote-text" className="block text-sm font-medium text-gray-700 mb-2">
            Quote Text
          </label>
          <textarea
            id="quote-text"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none transition-all resize-none"
            placeholder="Enter your quote..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
