
import React from 'react';
import { Download, Zap } from 'lucide-react';

interface ControlPanelProps {
  theme: string;
  setTheme: (theme: string) => void;
  onGenerate: () => void;
  onDownload: () => void;
  isLoading: boolean;
  isPostReady: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  theme,
  setTheme,
  onGenerate,
  onDownload,
  isLoading,
  isPostReady,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 h-full flex flex-col gap-6">
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-2">
          1. Enter a Theme
        </label>
        <input
          type="text"
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., perseverance, innovation, teamwork"
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-2">What's the vibe? This will inspire the quote and background.</p>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !theme}
        className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            2. Generate Post
          </>
        )}
      </button>

      <div className="border-t border-gray-700 my-2"></div>

      <button
        onClick={onDownload}
        disabled={!isPostReady}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
      >
        <Download className="w-5 h-5" />
        3. Download Post
      </button>
      <p className="text-xs text-gray-500 text-center">Downloads a 1080x1440px high-quality PNG image.</p>
    </div>
  );
};

export default ControlPanel;
