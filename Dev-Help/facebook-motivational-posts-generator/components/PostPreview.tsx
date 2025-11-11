import React, { forwardRef, useRef, useLayoutEffect, useState } from 'react';

interface PostPreviewProps {
  quote: string;
  imageUrl: string;
  isLoading: boolean;
}

const PostPreview = forwardRef<HTMLDivElement, PostPreviewProps>(
  ({ quote, imageUrl, isLoading }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.33); // Initial scale for a ~360px container

    useLayoutEffect(() => {
      if (!containerRef.current) return;

      // Use ResizeObserver to detect the container's size and calculate the correct scale factor
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          const containerWidth = entry.contentRect.width;
          const contentWidth = 1080; // The fixed width of the content div
          setScale(containerWidth / contentWidth);
        }
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        // This container defines the responsive size and aspect ratio of the preview area
        className="w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[480px] aspect-[3/4] shadow-2xl rounded-lg overflow-hidden transition-all duration-500 relative"
      >
        <div
          ref={ref}
          // This is the full-resolution element that will be captured for download.
          // It's positioned absolutely and scaled down to fit the container.
          className="bg-cover bg-center flex items-center justify-center p-16 absolute top-0 left-0"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            width: '1080px',
            height: '1440px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-20">
              <svg className="animate-spin h-12 w-12 text-yellow-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white text-3xl font-bold">Generating masterpiece...</p>
            </div>
          )}
          
          {/* Semi-transparent overlay for text readability */}
          {!isLoading && imageUrl && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}

          {/* Quote Text */}
          <h2 className="relative z-10 text-center text-white font-black text-8xl leading-tight" style={{ textShadow: '0px 6px 12px rgba(0, 0, 0, 0.7)' }}>
            {quote}
          </h2>

        </div>
      </div>
    );
  }
);

PostPreview.displayName = 'PostPreview';

export default PostPreview;