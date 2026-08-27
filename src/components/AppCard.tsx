import React from 'react';
import { Star, Download, ShieldCheck, Flame, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppData } from '../types';
import { calculateAppBadges, getRelativeTimeString } from '../utils/badges';

interface AppCardProps {
  key?: string;
  app: AppData;
  onSelect: (slug: string) => void;
  onDownload: (e: React.MouseEvent, app: AppData) => void;
  showUpdatedTime?: boolean;
}

export default function AppCard({ app, onSelect, onDownload, showUpdatedTime = false }: AppCardProps) {
  // Helper for formatting downloads (e.g., 5B+, 100M+)
  const formatDownloads = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)}B+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return num.toString();
  };

  // Calculate dynamic computed badges with priority order
  const allBadges = calculateAppBadges(app);
  // Show max 2 priority badges on card to prevent UI clutter
  const visibleBadges = allBadges.slice(0, 2);

  return (
    <div
      onClick={() => onSelect(app.slug)}
      id={`app-card-${app.id}`}
      className="group relative p-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 dark:hover:border-blue-500/40 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.08)] dark:hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.12)] transition-all duration-300 cursor-pointer active:scale-[0.99] select-none overflow-hidden"
    >
      {/* Dynamic decorative backdrop subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-500/0 group-hover:to-blue-500/[0.02] dark:group-hover:to-blue-500/[0.015] transition-all duration-300" />

      {/* Top Badges Bar if any */}
      {visibleBadges.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-2.5">
          {visibleBadges.map((b) => (
            <span
              key={b.type}
              title={b.description}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${b.colorClass}`}
            >
              {b.type === 'verified' && <CheckCircle2 className="h-2.5 w-2.5" />}
              {b.type === 'popular' && <Flame className="h-2.5 w-2.5" />}
              {b.type === 'featured' && <Sparkles className="h-2.5 w-2.5" />}
              {b.type === 'updated' && <RefreshCw className="h-2.5 w-2.5" />}
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-start gap-4 mb-4">
        {/* App Icon Container */}
        <div className="relative shrink-0">
          <img
            src={app.icon}
            alt={`${app.name} Icon`}
            referrerPolicy="no-referrer"
            className="w-14 h-14 object-cover rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 group-hover:rotate-1 transition-all duration-300"
          />
          {/* Safe/Verified badge overlay */}
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 border border-blue-100 dark:border-blue-950/80 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate leading-snug">
            {app.name}
          </h3>
          
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
            {app.developer}
          </p>

          {/* Details row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100/50 dark:border-slate-800">
              {app.category}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              • {app.version}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              • {app.size}
            </span>
          </div>

          {/* Relative update text if requested or on update view */}
          {showUpdatedTime && (
            <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1.5 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Diperbarui {getRelativeTimeString(app.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Footer statistics and Action */}
      <div className="relative z-10 mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
        {/* Ratings and Stats */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center text-amber-500 font-bold text-xs gap-0.5">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>{app.rating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {formatDownloads(app.downloads)} dwnld
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => onDownload(e, app)}
          id={`app-card-btn-${app.id}`}
          className="flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-all duration-200 shadow-sm"
          title="Unduh APK Langsung"
        >
          <Download className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

