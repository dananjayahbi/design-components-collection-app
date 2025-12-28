"use client";

export default function ReactSkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      {/* Preview skeleton */}
      <div className="aspect-video bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2 pt-1">
          <div className="h-5 bg-gray-100 rounded-full w-14" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-12" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function ReactSkeletonGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ReactSkeletonCard key={i} />
      ))}
    </div>
  );
}
