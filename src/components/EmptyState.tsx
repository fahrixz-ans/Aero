import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'Tidak Ada Hasil Ditemukan',
  description = 'Kami tidak menemukan aplikasi yang sesuai dengan kriteria pencarian Anda. Silakan coba kata kunci lain atau bersihkan filter.',
  actionLabel = 'Atur Ulang Pencarian',
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300" id="empty-state-container">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-4 animate-pulse">
        <SearchX className="h-10 w-10 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/15 cursor-pointer active:scale-95"
          id="empty-state-action"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
