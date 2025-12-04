"use client";

interface SkeletonCardProps {
  viewMode?: "grid" | "masonry";
  index?: number; // Add index prop for deterministic height
}

export default function SkeletonCard({ viewMode = "masonry", index = 0 }: SkeletonCardProps) {
  // Base skeleton with shimmer animation
  const shimmerClass = "animate-pulse bg-gray-200";
  
  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Thumbnail skeleton */}
        <div className={`w-full h-48 ${shimmerClass}`} />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Title skeleton */}
          <div className={`h-5 w-3/4 rounded ${shimmerClass}`} />
          
          {/* Description skeleton */}
          <div className="space-y-2">
            <div className={`h-3 w-full rounded ${shimmerClass}`} />
            <div className={`h-3 w-5/6 rounded ${shimmerClass}`} />
          </div>
          
          {/* Tags skeleton */}
          <div className="flex gap-2">
            <div className={`h-6 w-16 rounded-full ${shimmerClass}`} />
            <div className={`h-6 w-12 rounded-full ${shimmerClass}`} />
          </div>
          
          {/* Footer skeleton */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className={`h-4 w-24 rounded ${shimmerClass}`} />
            <div className="flex gap-2">
              <div className={`h-8 w-8 rounded ${shimmerClass}`} />
              <div className={`h-8 w-8 rounded ${shimmerClass}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Masonry skeleton with deterministic varying heights based on index
  const heights = ["h-64", "h-72", "h-80", "h-56"];
  const heightIndex = index % heights.length;
  const selectedHeight = heights[heightIndex];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 break-inside-avoid">
      {/* Thumbnail skeleton with deterministic height based on index */}
      <div className={`w-full ${selectedHeight} ${shimmerClass}`} />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className={`h-5 w-3/4 rounded ${shimmerClass}`} />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className={`h-3 w-full rounded ${shimmerClass}`} />
          <div className={`h-3 w-4/5 rounded ${shimmerClass}`} />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2 flex-wrap">
          <div className={`h-6 w-14 rounded-full ${shimmerClass}`} />
          <div className={`h-6 w-10 rounded-full ${shimmerClass}`} />
          <div className={`h-6 w-16 rounded-full ${shimmerClass}`} />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className={`h-4 w-20 rounded ${shimmerClass}`} />
          <div className="flex gap-2">
            <div className={`h-8 w-8 rounded ${shimmerClass}`} />
            <div className={`h-8 w-8 rounded ${shimmerClass}`} />
            <div className={`h-8 w-8 rounded ${shimmerClass}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for rendering multiple skeleton cards
export function SkeletonGrid({ count = 8, viewMode = "masonry" }: { count?: number; viewMode?: "grid" | "masonry" }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {skeletons.map((index) => (
          <SkeletonCard key={`skeleton-${index}`} viewMode={viewMode} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {skeletons.map((index) => (
        <SkeletonCard key={`skeleton-${index}`} viewMode={viewMode} index={index} />
      ))}
    </div>
  );
}
