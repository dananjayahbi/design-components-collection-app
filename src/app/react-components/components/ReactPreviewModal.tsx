"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
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
      const timer = setTimeout(() => setIsReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [sandpack.status]);

  if (!isReady && !hasError) {
    return (
      <div className="w-full flex items-center justify-center bg-gray-50" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <SandpackLayout style={{ height }}>
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={true}
        style={{ height, width: "100%" }}
      />
    </SandpackLayout>
  );
}

interface ReactPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentName: string;
  componentCode: string;
  cssCode?: string;
  dependencies?: string[];
}

export default function ReactPreviewModal({
  isOpen,
  onClose,
  componentName,
  componentCode,
  cssCode = "",
  dependencies = [],
}: ReactPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  
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

  // Measure container height dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Auto-detect dependencies from code imports
  const detectedDependencies = useMemo(() => {
    const deps = new Set<string>();
    
    // Match import statements
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(componentCode)) !== null) {
      const packageName = match[1];
      if (packageName.startsWith('@')) {
        const parts = packageName.split('/');
        if (parts.length >= 2) {
          deps.add(`${parts[0]}/${parts[1]}`);
        }
      } else {
        const parts = packageName.split('/');
        deps.add(parts[0]);
      }
    }
    
    // Remove built-in packages
    const builtIns = ['react', 'react-dom', 'react/jsx-runtime'];
    builtIns.forEach(pkg => deps.delete(pkg));
    
    return Array.from(deps);
  }, [componentCode]);

  // Build dependency object for Sandpack - combine stored + detected
  const sandpackDependencies = useMemo(() => {
    const deps: Record<string, string> = {};
    
    for (const dep of dependencies) {
      deps[dep] = 'latest';
    }
    
    for (const dep of detectedDependencies) {
      if (!deps[dep]) {
        deps[dep] = 'latest';
      }
    }
    
    return deps;
  }, [dependencies, detectedDependencies]);

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

  // Prepare the component code
  const preparedCode = useMemo(() => {
    let code = componentCode;
    
    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    
    if (!code.includes('export default')) {
      const constMatch = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
      const funcMatch = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
      const componentNameMatch = constMatch?.[1] || funcMatch?.[1];
      
      if (componentNameMatch) {
        code = code + `\n\nexport default ${componentNameMatch};`;
      }
    }
    
    return code;
  }, [componentCode]);

  // Files for Sandpack
  const files = useMemo(() => {
    const combinedCss = cssCode.trim() ? `${baseCss}\n\n${cssCode}` : baseCss;
    
    const packageJson = {
      name: "sandpack-project",
      main: "/index.js",
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        ...sandpackDependencies,
      },
    };
    
    return {
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
    } as Record<string, { code: string; active?: boolean; hidden?: boolean }>;
  }, [preparedCode, cssCode, sandpackDependencies, baseCss]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-[90vw] max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold text-lg">{componentName}</span>
            <span className="text-white/70 text-sm">(Preview)</span>
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

        {/* Sandpack Preview - dynamically sized */}
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-hidden bg-white"
        >
          {containerHeight !== null && containerHeight > 0 && (
            <SandpackProvider
              key={detectedDependencies.join(',')}
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

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-gray-500 text-sm">
            Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
