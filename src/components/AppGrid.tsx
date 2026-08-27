import React, { useState } from 'react';
import AppCard from './AppCard';
import EmptyState from './EmptyState';
import { AppData } from '../types';

interface AppGridProps {
  apps: AppData[];
  onSelect: (slug: string) => void;
  onDownload: (e: React.MouseEvent, app: AppData) => void;
  onResetSearch?: () => void;
  pageSize?: number;
}

export default function AppGrid({
  apps,
  onSelect,
  onDownload,
  onResetSearch,
  pageSize = 8
}: AppGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination bounds
  const totalPages = Math.ceil(apps.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedApps = apps.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to section head smoothly
    const element = document.getElementById('app-grid-view');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (apps.length === 0) {
    return (
      <EmptyState
        title="Aplikasi Tidak Ditemukan"
        description="Maaf, kami tidak dapat menemukan aplikasi Android yang sesuai dengan pencarian Anda. Silakan bersihkan kata kunci pencarian atau filter kategori Anda."
        onAction={onResetSearch}
      />
    );
  }

  return (
    <div className="space-y-8" id="app-grid-view">
      {/* Grid wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {paginatedApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onSelect={onSelect}
            onDownload={onDownload}
          />
        ))}
      </div>

      {/* Pagination component logic integrated cleanly */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4" id="pagination-controls">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            Sebelumnya
          </button>
          
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
