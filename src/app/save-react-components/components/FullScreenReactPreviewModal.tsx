"use client";

import { useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";

interface FullScreenReactPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentCode: string;
  cssCode: string;
}

export default function FullScreenReactPreviewModal({
  isOpen,
  onClose,
  componentCode,
  cssCode,
}: FullScreenReactPreviewModalProps) {
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

  // Generate the srcdoc content with React runtime
  const srcdoc = useMemo(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
      background: #ffffff;
      min-height: 100vh;
    }
    .error-container {
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      color: #dc2626;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .error-title {
      font-weight: bold;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* User CSS */
    ${cssCode}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    try {
      // User's React component code
      ${componentCode}
      
      // Try to render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      // Check if there's a default export or named App/Component
      if (typeof App !== 'undefined') {
        root.render(<App />);
      } else if (typeof Component !== 'undefined') {
        root.render(<Component />);
      } else if (typeof Default !== 'undefined') {
        root.render(<Default />);
      } else {
        // Try to find any function component defined
        const componentNames = Object.keys(window).filter(key => 
          typeof window[key] === 'function' && 
          /^[A-Z]/.test(key) && 
          key !== 'React' && 
          key !== 'ReactDOM'
        );
        
        if (componentNames.length > 0) {
          const FirstComponent = window[componentNames[componentNames.length - 1]];
          root.render(<FirstComponent />);
        } else {
          throw new Error('No React component found. Please define a component named App, Component, or any PascalCase function component.');
        }
      }
    } catch (error) {
      document.getElementById('root').innerHTML = \`
        <div class="error-container">
          <div class="error-title">⚠️ Error</div>
          \${error.message}
        </div>
      \`;
      console.error('React Sandbox Error:', error);
    }
  </script>
</body>
</html>
    `;
  }, [componentCode, cssCode]);

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
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚛️</span>
            <span className="text-white font-semibold text-lg">React Preview</span>
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
            title="Full Screen React Preview"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
