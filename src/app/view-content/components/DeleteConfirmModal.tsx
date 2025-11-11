"use client";

import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface DeleteConfirmModalProps {
  rowId: number;
  quote: string;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteConfirmModal({ rowId, quote, onClose, onDelete }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/quotes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete quote');
        return;
      }

      toast.success('Quote deleted successfully!');
      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('An error occurred while deleting quote');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Delete Quote</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this quote? This action cannot be undone.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700 italic line-clamp-3">
            "{quote}"
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Quote'}
          </button>
        </div>
      </div>
    </div>
  );
}
