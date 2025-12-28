"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { 
  SUPPORTED_DEPENDENCIES, 
  detectDependenciesFromCode,
  type DependencyConfig 
} from "@/lib/constants/reactDependencies";

interface DependencySelectorProps {
  selectedDependencies: string[];
  onDependenciesChange: (dependencies: string[]) => void;
  componentCode: string;
}

const categoryLabels: Record<DependencyConfig['category'], string> = {
  icons: '🎨 Icons',
  animation: '✨ Animation',
  ui: '🧩 UI Components',
  utility: '🔧 Utility',
  state: '📦 State Management',
  styling: '💅 Styling',
};

const categoryOrder: DependencyConfig['category'][] = [
  'icons',
  'animation',
  'ui',
  'utility',
  'state',
  'styling',
];

export default function DependencySelector({
  selectedDependencies,
  onDependenciesChange,
  componentCode,
}: DependencySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detectedDeps, setDetectedDeps] = useState<string[]>([]);

  // Detect dependencies when code changes
  useEffect(() => {
    const detected = detectDependenciesFromCode(componentCode);
    setDetectedDeps(detected);
  }, [componentCode]);

  // Group dependencies by category
  const groupedDeps = useMemo(() => {
    const groups: Record<DependencyConfig['category'], DependencyConfig[]> = {
      icons: [],
      animation: [],
      ui: [],
      utility: [],
      state: [],
      styling: [],
    };
    
    for (const dep of SUPPORTED_DEPENDENCIES) {
      groups[dep.category].push(dep);
    }
    
    return groups;
  }, []);

  const toggleDependency = (depName: string) => {
    if (selectedDependencies.includes(depName)) {
      onDependenciesChange(selectedDependencies.filter(d => d !== depName));
    } else {
      onDependenciesChange([...selectedDependencies, depName]);
    }
  };

  const addDetectedDeps = () => {
    const newDeps = [...new Set([...selectedDependencies, ...detectedDeps])];
    onDependenciesChange(newDeps);
  };

  // Check if there are unselected detected dependencies
  const hasUnselectedDetected = detectedDeps.some(d => !selectedDependencies.includes(d));

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-700">Dependencies</span>
          {selectedDependencies.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {selectedDependencies.length} selected
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Detected dependencies alert */}
      {hasUnselectedDetected && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>
              Detected {detectedDeps.length} dependenc{detectedDeps.length === 1 ? 'y' : 'ies'} in your code
            </span>
          </div>
          <button
            onClick={addDetectedDeps}
            className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors"
          >
            Add All
          </button>
        </div>
      )}

      {/* Selected dependencies pills */}
      {selectedDependencies.length > 0 && !isExpanded && (
        <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2">
          {selectedDependencies.map(depName => {
            const dep = SUPPORTED_DEPENDENCIES.find(d => d.name === depName);
            if (!dep) return null;
            return (
              <span
                key={depName}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {dep.displayName}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDependency(depName);
                  }}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 max-h-80 overflow-y-auto">
          {/* Info message */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Select the npm packages your component needs. They will be loaded via CDN in the preview.
            </p>
          </div>

          {/* Dependencies by category */}
          <div className="space-y-4">
            {categoryOrder.map(category => {
              const deps = groupedDeps[category];
              if (deps.length === 0) return null;
              
              return (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {categoryLabels[category]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deps.map(dep => {
                      const isSelected = selectedDependencies.includes(dep.name);
                      const isDetected = detectedDeps.includes(dep.name);
                      
                      return (
                        <button
                          key={dep.name}
                          onClick={() => toggleDependency(dep.name)}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border transition-all text-left
                            ${isSelected 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className={`
                            shrink-0 w-5 h-5 rounded border flex items-center justify-center
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                {dep.displayName}
                              </span>
                              {isDetected && !isSelected && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                                  detected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {dep.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
