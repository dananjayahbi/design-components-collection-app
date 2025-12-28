"use client";

import { useMemo, useCallback, useState } from "react";
import { Maximize2, RefreshCw } from "lucide-react";
import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

interface ReactSandboxPreviewProps {
  componentCode: string;
  cssCode?: string;
  dependencies?: string[];
  onExpand?: () => void;
}

export default function ReactSandboxPreview({
  componentCode,
  cssCode = "",
  dependencies = [],
  onExpand,
}: ReactSandboxPreviewProps) {
  const [key, setKey] = useState(0);

  // Force refresh the preview
  const handleRefresh = useCallback(() => {
    setKey(prev => prev + 1);
  }, []);

  // Build dependency object for Sandpack
  const sandpackDependencies = useMemo(() => {
    const deps: Record<string, string> = {};
    
    for (const dep of dependencies) {
      deps[dep] = 'latest';
    }
    
    return deps;
  }, [dependencies]);

  // Prepare the component code - add React import and ensure export
  const preparedCode = useMemo(() => {
    let code = componentCode;
    
    // Add React import if not present (for React.useState, React.useEffect etc.)
    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    
    // Check if code has export default
    if (!code.includes('export default')) {
      // Pattern: const ComponentName = () => or const ComponentName = function
      const constMatch = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
      // Pattern: function ComponentName
      const funcMatch = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
      
      const componentName = constMatch?.[1] || funcMatch?.[1];
      
      if (componentName) {
        code = code + `\n\nexport default ${componentName};`;
      }
    }
    
    return code;
  }, [componentCode]);

  // Files for Sandpack
  const files = useMemo(() => {
    const fileMap: Record<string, { code: string; active?: boolean }> = {
      "/App.js": {
        code: preparedCode,
        active: true,
      },
    };
    
    // Only add CSS file if there's custom CSS
    if (cssCode.trim()) {
      fileMap["/styles.css"] = { code: cssCode };
    }
    
    return fileMap;
  }, [preparedCode, cssCode]);

  return (
    <div className="h-full w-full rounded-lg border-2 border-emerald-400 overflow-hidden bg-white flex flex-col">
      {/* Header */}
      <div className="bg-emerald-600 px-3 py-2 flex items-center gap-2 shrink-0">
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
          {/* Window dots */}
          <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>

      {/* Sandpack Preview */}
      <div className="flex-1 min-h-0">
        <SandpackProvider
          key={key}
          template="react"
          files={files}
          customSetup={{
            dependencies: sandpackDependencies,
          }}
          options={{
            recompileMode: "delayed",
            recompileDelay: 1000,
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
          theme="light"
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%" }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
}
