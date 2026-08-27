import React from 'react';

export default function LoadingSkeleton({ type = 'grid', count = 6 }: { type?: 'grid' | 'featured' | 'detail'; count?: number }) {
  if (type === 'detail') {
    return (
      <div className="animate-pulse space-y-8" id="skeleton-detail">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 md:w-1/3" />
            <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-1/4" />
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-5 bg-slate-100 dark:bg-slate-850 rounded-full w-20" />
              <div className="h-5 bg-slate-100 dark:bg-slate-850 rounded-full w-16" />
            </div>
          </div>
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full md:w-40 shrink-0" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-12" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded mx-auto w-16" />
            </div>
          ))}
        </div>

        {/* Content Section Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-full" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-11/12" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-5/6" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
              <div className="h-32 bg-slate-100 dark:bg-slate-850 rounded-xl w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-5 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-10 bg-slate-150 dark:bg-slate-800 rounded-xl w-full" />
              <div className="h-10 bg-slate-150 dark:bg-slate-800 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'featured') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="skeleton-featured">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-4 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-10" />
                <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" id="skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col animate-pulse">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-2/3" />
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
            <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded w-1/4" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
