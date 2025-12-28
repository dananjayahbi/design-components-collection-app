"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Maximize2, RefreshCw } from "lucide-react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpack,
} from "@codesandbox/sandpack-react";

// Wrapper component that waits for bundler to be ready before showing preview
function SandpackPreviewWithLoading({ height }: { height: number }) {
  const { sandpack, listen } = useSandpack();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Listen for bundler status messages
    const stopListening = listen((message) => {
      if (message.type === "done") {
        setIsReady(true);
      }
      if (message.type === "action" && message.action === "show-error") {
        setHasError(true);
      }
    });

    return () => stopListening();
  }, [listen]);

  // Also check sandpack status
  useEffect(() => {
    if (sandpack.status === "running") {
      // Give a little time for the bundler to finish
      const timer = setTimeout(() => setIsReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [sandpack.status]);

  if (!isReady && !hasError) {
    return (
      <div className="w-full flex items-center justify-center bg-gray-50" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <SandpackLayout style={{ height }}>
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        style={{ height, width: "100%" }}
      />
    </SandpackLayout>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  // Force refresh the preview
  const handleRefresh = useCallback(() => {
    setKey(prev => prev + 1);
  }, []);

  // Refresh when dependencies change to force Sandpack to reload with new dependencies
  useEffect(() => {
    // Only refresh if dependencies actually changed (not initial render)
    if (dependencies.length > 0) {
      setKey(prev => prev + 1);
    }
  }, [dependencies.join(',')]); // Use join to create a stable string for comparison

  // Measure container height dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    // Initial measurement
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // Build dependency object for Sandpack
  const sandpackDependencies = useMemo(() => {
    const deps: Record<string, string> = {};
    
    for (const dep of dependencies) {
      deps[dep] = 'latest';
    }
    
    return deps;
  }, [dependencies]);

  // Base CSS for centering content in the preview
  const baseCss = `
body, html {
  margin: 0;
  padding: 0;
  min-height: 100%;
}
#root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
`.trim();

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

  // Files for Sandpack - always include base CSS for centering
  const files = useMemo(() => {
    // Combine base CSS with any custom CSS
    const combinedCss = cssCode.trim() ? `${baseCss}\n\n${cssCode}` : baseCss;
    
    // Build package.json with dependencies for more reliable loading
    const packageJson = {
      name: "sandpack-project",
      main: "/index.js",
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        ...sandpackDependencies,
      },
    };
    
    const fileMap: Record<string, { code: string; active?: boolean; hidden?: boolean }> = {
      "/App.js": {
        code: preparedCode,
        active: true,
      },
      "/styles.css": {
        code: combinedCss,
      },
      "/package.json": {
        code: JSON.stringify(packageJson, null, 2),
        hidden: true,
      },
    };
    
    return fileMap;
  }, [preparedCode, cssCode, baseCss, sandpackDependencies]);

  return (
    <div className="h-full w-full rounded-lg border-2 border-emerald-400 overflow-hidden bg-white flex flex-col">
      {/* Header */}
      <div className="bg-emerald-600 px-3 py-2 flex items-center gap-2 shrink-0">
        <span className="text-lg"></span>
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

      {/* Sandpack Preview - dynamically sized */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
      >
        {containerHeight !== null && containerHeight > 0 && (
          <SandpackProvider
            key={`${key}-${dependencies.join(',')}`}
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
            <SandpackPreviewWithLoading height={containerHeight} />
          </SandpackProvider>
        )}
      </div>
    </div>
  );
}
