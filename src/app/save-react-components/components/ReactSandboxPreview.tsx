"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { Maximize2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

interface ReactSandboxPreviewProps {
  componentCode: string;
  cssCode: string;
  onExpand?: () => void;
}

export default function ReactSandboxPreview({
  componentCode,
  cssCode,
  onExpand,
}: ReactSandboxPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  // Force refresh the preview
  const handleRefresh = useCallback(() => {
    setKey(prev => prev + 1);
    setError(null);
  }, []);

  // Generate the srcdoc content with React runtime
  const srcdoc = useMemo(() => {
    // Reset error when code changes
    setError(null);
    
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

  // Open preview in new tab
  const handleOpenInNewTab = useCallback(() => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(srcdoc);
      newWindow.document.close();
    }
  }, [srcdoc]);

  return (
    <div className="h-full w-full rounded-lg border-2 border-emerald-400 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-emerald-600 px-3 py-2 flex items-center gap-2">
        <span className="text-lg">⚛️</span>
        <span className="text-white font-semibold text-sm">React Preview</span>
        <div className="flex items-center gap-2 ml-auto">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
          {/* Expand button */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Open in Full Screen Modal"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          )}
          {/* Open in new tab button */}
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4 text-white" />
          </button>
          {/* Window dots */}
          <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Iframe Sandbox using srcdoc */}
      <iframe
        key={key}
        title="React Component Preview"
        className="w-full h-[calc(100%-40px)] bg-white"
        srcDoc={srcdoc}
        sandbox="allow-scripts"
      />
    </div>
  );
}
