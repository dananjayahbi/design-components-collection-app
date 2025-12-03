"use client";

import { useMemo, useCallback } from "react";
import { Maximize2, ExternalLink } from "lucide-react";

interface SandboxPreviewProps {
  html: string;
  css: string;
  javascript: string;
  onExpand?: () => void;
}

export default function SandboxPreview({
  html,
  css,
  javascript,
  onExpand,
}: SandboxPreviewProps) {
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

  // Open preview in new tab
  const handleOpenInNewTab = useCallback(() => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(srcdoc);
      newWindow.document.close();
    }
  }, [srcdoc]);

  return (
    <div className="h-full w-full rounded-lg border-2 border-gray-300 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-700 px-3 py-2 flex items-center gap-2">
        <span className="text-white font-semibold text-sm">Preview</span>
        <div className="flex items-center gap-2 ml-auto">
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

      {/* Iframe Sandbox using srcdoc */}
      <iframe
        title="Component Preview"
        className="w-full h-[calc(100%-40px)] bg-white"
        srcDoc={srcdoc}
        sandbox="allow-scripts"
      />
    </div>
  );
}
