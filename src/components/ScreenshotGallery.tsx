import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenshotGalleryProps {
  screenshots: string[];
  appName: string;
}

export default function ScreenshotGallery({ screenshots, appName }: ScreenshotGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx + 1) % screenshots.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx - 1 + screenshots.length) % screenshots.length);
    }
  };

  return (
    <div className="space-y-3" id="screenshot-gallery">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Tangkapan Layar
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          Klik untuk memperbesar gambar
        </span>
      </div>

      {/* Horizontal Scrollable Row */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 snap-x snap-mandatory">
        {screenshots.map((url, idx) => (
          <div
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className="relative flex-none w-52 sm:w-60 aspect-[9/16] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 snap-start cursor-zoom-in group shadow-sm bg-slate-100 dark:bg-slate-950"
          >
            <img
              src={url}
              alt={`${appName} Screenshot ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-350"
              loading="lazy"
            />
            {/* Hover zoom overlay indicator */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-full text-slate-800 dark:text-white shadow">
                <Maximize2 className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Lightbox Modal overlay */}
      {activeIdx !== null && (
        <div
          onClick={() => setActiveIdx(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fade-in"
          id="lightbox-overlay"
        >
          {/* Close button */}
          <button
            onClick={() => setActiveIdx(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer hidden sm:block"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Image wrapper */}
          <div className="relative max-w-full max-h-[85vh] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={screenshots[activeIdx]}
              alt={`${appName} Zoomed Screenshot`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer hidden sm:block"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicator label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-semibold text-sm bg-black/55 px-4 py-1.5 rounded-full border border-white/10">
            {activeIdx + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
