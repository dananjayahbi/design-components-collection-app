"use client";

import { Code, Layers } from "lucide-react";

interface ThumbnailPlaceholderProps {
  name?: string;
  className?: string;
}

/**
 * A styled placeholder component shown when no thumbnail is available
 * Displays a decorative code/component themed visual
 */
export function ThumbnailPlaceholder({ name, className = "" }: ThumbnailPlaceholderProps) {
  // Generate a deterministic color based on the component name
  const getPlaceholderColor = (str: string = ""): string => {
    const colors = [
      "from-violet-500 to-purple-600",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-amber-500",
      "from-pink-500 to-rose-500",
      "from-indigo-500 to-blue-500",
      "from-fuchsia-500 to-pink-500",
      "from-lime-500 to-green-500",
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const gradientColor = getPlaceholderColor(name);

  return (
    <div 
      className={`relative w-full h-full min-h-[150px] bg-gradient-to-br ${gradientColor} flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-8 h-8 rounded bg-white/20 backdrop-blur-sm" />
      <div className="absolute bottom-4 right-4 w-12 h-6 rounded bg-white/20 backdrop-blur-sm" />
      <div className="absolute top-1/4 right-8 w-6 h-6 rounded-full bg-white/15" />
      <div className="absolute bottom-1/3 left-8 w-4 h-4 rounded-full bg-white/15" />

      {/* Center icon */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
          <Code className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
          <Layers className="w-3.5 h-3.5 text-white/90" />
          <span className="text-xs font-medium text-white/90">Component</span>
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -skew-x-12" />
    </div>
  );
}

export default ThumbnailPlaceholder;
