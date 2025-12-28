"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Edit, Trash2, ExternalLink, Code, Eye } from "lucide-react";
import type { ReactComponent } from "../hooks";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpack,
} from "@codesandbox/sandpack-react";
import ReactPreviewModal from "./ReactPreviewModal";

// Wrapper component that waits for bundler to be ready
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
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-400 text-xs">Loading...</p>
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

interface ReactComponentCardProps {
  component: ReactComponent;
  onEdit: (component: ReactComponent) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ReactComponentCard({
  component,
  onEdit,
  onDelete,
}: ReactComponentCardProps) {
  // Show live preview by default if no thumbnail
  const [showPreview, setShowPreview] = useState(!component.thumbnailUrl);
  const [imageError, setImageError] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [shouldRenderSandpack, setShouldRenderSandpack] = useState(false);

  // Use IntersectionObserver to only render Sandpack when card is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Stagger Sandpack initialization - wait for view + random delay to avoid race conditions
  useEffect(() => {
    if (isInView && showPreview && !shouldRenderSandpack) {
      // Add a random stagger delay (0-1000ms) to avoid all cards initializing at once
      const staggerDelay = Math.random() * 1000;
      const timer = setTimeout(() => {
        setShouldRenderSandpack(true);
      }, staggerDelay);
      return () => clearTimeout(timer);
    }
  }, [isInView, showPreview, shouldRenderSandpack]);

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
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // If thumbnail has error, switch to live preview
  useEffect(() => {
    if (imageError && !showPreview) {
      setShowPreview(true);
    }
  }, [imageError, showPreview]);

  // Auto-detect dependencies from code imports (fallback if not stored in DB)
  const detectedDependencies = useMemo(() => {
    const deps = new Set<string>();
    const code = component.componentCode;
    
    // Match import statements: import ... from 'package-name' or "package-name"
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const packageName = match[1];
      // Get the root package name (e.g., "@scope/package" or "package")
      if (packageName.startsWith('@')) {
        // Scoped package: @scope/package
        const parts = packageName.split('/');
        if (parts.length >= 2) {
          deps.add(`${parts[0]}/${parts[1]}`);
        }
      } else {
        // Regular package
        const parts = packageName.split('/');
        deps.add(parts[0]);
      }
    }
    
    // Remove built-in/standard packages
    const builtIns = ['react', 'react-dom', 'react/jsx-runtime'];
    builtIns.forEach(pkg => deps.delete(pkg));
    
    return Array.from(deps);
  }, [component.componentCode]);

  // Build dependency object for Sandpack - combine stored + detected
  const sandpackDependencies = useMemo(() => {
    const deps: Record<string, string> = {};
    
    // First add stored dependencies
    for (const dep of (component.dependencies || [])) {
      deps[dep] = 'latest';
    }
    
    // Then add auto-detected dependencies (these may not be in DB)
    for (const dep of detectedDependencies) {
      if (!deps[dep]) {
        deps[dep] = 'latest';
      }
    }
    
    return deps;
  }, [component.dependencies, detectedDependencies]);

  // Base CSS to center components in preview
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

  // Prepare the component code - memoized
  const preparedCode = useMemo(() => {
    let code = component.componentCode;
    
    // Add React import if not present
    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    
    if (!code.includes('export default')) {
      const constMatch = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
      const funcMatch = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
      const componentName = constMatch?.[1] || funcMatch?.[1];
      if (componentName) {
        code = code + `\n\nexport default ${componentName};`;
      }
    }
    return code;
  }, [component.componentCode]);

  // Files for Sandpack - memoized
  const files = useMemo(() => {
    const combinedCss = component.cssCode?.trim() 
      ? `${baseCss}\n\n${component.cssCode}` 
      : baseCss;

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
  }, [preparedCode, component.cssCode, sandpackDependencies, baseCss]);

  const formattedDate = new Date(component.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Stable key for Sandpack based on component ID and dependencies
  const sandpackKey = useMemo(() => {
    return `${component.id}-${(component.dependencies || []).join(',')}`;
  }, [component.id, component.dependencies]);

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden break-inside-avoid">
      {/* Preview Area - taller height to show more of the component */}
      <div ref={containerRef} className="relative h-[320px] bg-gray-50 overflow-hidden">
        {/* Show thumbnail if available and not in preview mode */}
        {!showPreview && component.thumbnailUrl && !imageError ? (
          <img
            src={component.thumbnailUrl}
            alt={component.name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : shouldRenderSandpack && containerHeight !== null && containerHeight > 0 ? (
          // Live React Preview with Sandpack - only when in view and staggered
          <SandpackProvider
            key={sandpackKey}
            template="react"
            files={files}
            customSetup={{
              dependencies: sandpackDependencies,
            }}
            options={{
              recompileMode: "delayed",
              recompileDelay: 1000,
              externalResources: ["https://cdn.tailwindcss.com"],
              initMode: "lazy",
              initModeObserverOptions: { rootMargin: "200px" },
            }}
            theme="light"
          >
            <SandpackPreviewWithLoading height={containerHeight} />
          </SandpackProvider>
        ) : (
          // Loading state while waiting for sandpack to be ready
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Overlay on hover - positioned at bottom for easier access */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex items-end justify-center gap-2">
          {/* Only show toggle button if there's a thumbnail to switch between */}
          {component.thumbnailUrl && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              title={showPreview ? "Show Thumbnail" : "Show Live Preview"}
            >
              <Code className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title="Preview at Full Scale"
          >
            <Eye className="w-5 h-5 text-green-600" />
          </button>
          <button
            onClick={() => onEdit(component)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit Component"
          >
            <Edit className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(component.id, component.name)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title="Delete Component"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* React badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
           React
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate" title={component.name}>
          {component.name}
        </h3>
        
        {component.description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {component.description}
          </p>
        )}

        {/* Tags */}
        {component.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {component.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{component.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{formattedDate}</span>
          <button
            onClick={() => onEdit(component)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Open <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <ReactPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        componentName={component.name}
        componentCode={component.componentCode}
        cssCode={component.cssCode}
        dependencies={component.dependencies}
      />
    </div>
  );
}
