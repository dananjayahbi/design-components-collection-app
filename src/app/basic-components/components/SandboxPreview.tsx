"use client";

import { useMemo } from "react";

interface SandboxPreviewProps {
  html: string;
  css: string;
  javascript: string;
}

export default function SandboxPreview({
  html,
  css,
  javascript,
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

  return (
    <div className="h-full w-full rounded-lg border-2 border-gray-300 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-700 px-3 py-2 flex items-center gap-2">
        <span className="text-lg">👁️</span>
        <span className="text-white font-semibold text-sm">Preview</span>
        <div className="flex gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
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
