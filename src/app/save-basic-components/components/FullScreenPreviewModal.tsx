"use client";

import { useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";

interface FullScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  css: string;
  javascript: string;
}

export default function FullScreenPreviewModal({
  isOpen,
  onClose,
  html,
  css,
  javascript,
}: FullScreenPreviewModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  // Generate the srcdoc content
  const srcdoc = useMemo(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset default styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      min-height: 100vh;
    }
    /* User CSS */
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try {
      ${javascript}
    } catch (error) {
      console.error('JavaScript Error:', error);
    }
  </script>
</body>
</html>
    `;
  }, [html, css, javascript]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-[95vw] h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold text-lg">Preview</span>
            <span className="text-white/70 text-sm">(Full Screen)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Preview Iframe */}
        <div className="flex-1 min-h-0 bg-white">
          <iframe
            title="Full Screen Preview"
            className="w-full h-full bg-white"
            srcDoc={srcdoc}
            sandbox="allow-scripts"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
          <span className="text-gray-500 text-sm">
            Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4a41c7] transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
