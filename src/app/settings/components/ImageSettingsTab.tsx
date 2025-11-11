"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ImageSettings {
  id: string;
  defaultAspectRatio: string;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Fullscreen)" },
  { value: "3:4", label: "3:4 (Portrait Fullscreen)" },
  { value: "9:16", label: "9:16 (Portrait)" },
];

export function ImageSettingsTab() {
  const [imageSettings, setImageSettings] = useState<ImageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImageSettings();
  }, []);

  const fetchImageSettings = async () => {
    try {
      const response = await fetch('/api/settings/image-settings');
      const data = await response.json();
      setImageSettings(data.settings || null);
    } catch (error) {
      console.error('Error fetching image settings:', error);
      toast.error('Failed to load image settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAspectRatio = async (aspectRatio: string) => {
    try {
      const response = await fetch('/api/settings/image-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultAspectRatio: aspectRatio }),
      });

      if (!response.ok) throw new Error();

      toast.success('Default aspect ratio updated');
      fetchImageSettings();
    } catch (error) {
      toast.error('Failed to update aspect ratio');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#5B50E8]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Generation Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Aspect Ratio
          </label>
          <select
            value={imageSettings?.defaultAspectRatio || "3:4"}
            onChange={(e) => handleUpdateAspectRatio(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none text-sm w-full md:w-64"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            This will be the default aspect ratio when generating background images
          </p>
        </div>
      </div>
    </div>
  );
}
