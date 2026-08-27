import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Calendar, Sparkles, Filter, Search, ArrowRight, 
  Download, ExternalLink, ShieldCheck, ChevronDown, ChevronUp, Clock, Flame, CheckCircle2
} from 'lucide-react';
import { AppData } from '../types';
import { CATEGORIES } from '../data/appsData';
import { calculateAppBadges, getRelativeTimeString } from '../utils/badges';

interface RecentlyUpdatedPageProps {
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
}

export default function RecentlyUpdatedPage({
  apps,
  onSelectApp,
  onDownloadApp,
  onNavigate
}: RecentlyUpdatedPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedChangelogIds, setExpandedChangelogIds] = useState<string[]>([]);

  // Toggle changelog expansion
  const toggleChangelog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChangelogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Only consider apps with published status (or standard)
  const publishedApps = useMemo(() => {
    return apps.filter(app => {
      const status = app.status || 'published';
      if (status === 'draft' || status === 'archived') return false;
      if (status === 'scheduled' && app.publishAt) {
        return new Date(app.publishAt).getTime() <= Date.now();
      }
      return true;
    });
  }, [apps]);

  // Filter and sort by updatedAt desc
  const filteredAndSortedApps = useMemo(() => {
    const now = Date.now();

    return publishedApps
      .filter(app => {
        // Category filter
        if (selectedCategory !== 'all' && app.category !== selectedCategory) {
          return false;
        }

        // Time range filter
        if (timeRange !== 'all') {
          const appDate = new Date(app.updatedAt).getTime();
          const diffDays = (now - appDate) / (1000 * 60 * 60 * 24);
          if (timeRange === 'today' && diffDays > 1) return false;
          if (timeRange === '7days' && diffDays > 7) return false;
          if (timeRange === '30days' && diffDays > 30) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = 
            app.name.toLowerCase().includes(q) ||
            app.developer.toLowerCase().includes(q) ||
            (app.whatsNew && app.whatsNew.toLowerCase().includes(q)) ||
            app.category.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [publishedApps, selectedCategory, timeRange, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" id="recently-updated-page">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              LIVE UPDATE KATALOG
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Aplikasi Baru Diperbarui
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Pantau rilis versi APK terbaru, log perbaikan bug, dan pembaruan fitur resmi harian.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
          <span className="text-xs font-bold px-3 text-slate-600 dark:text-slate-400">
            {filteredAndSortedApps.length} Aplikasi Terkini
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4 p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari rilis update, nama aplikasi, atau changelog..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Rentang:
            </span>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === '7days'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === '30days'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            Semua Kategori
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recently Updated App Cards Feed */}
      {filteredAndSortedApps.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/10 rounded-3xl space-y-3">
          <RefreshCw className="h-10 w-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada pembaruan aplikasi yang ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah filter kategori atau perluas rentang waktu pencarian untuk melihat pembaruan lainnya.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setTimeRange('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAndSortedApps.map((app) => {
            const isExpanded = expandedChangelogIds.includes(app.id);
            const badges = calculateAppBadges(app);
            const relativeTime = getRelativeTimeString(app.updatedAt);

            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app.slug)}
                className="group relative p-5 bg-white dark:bg-white/[0.03] border border-slate-150 dark:border-white/10 rounded-3xl hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                        <Clock className="h-2.5 w-2.5" /> {relativeTime}
                      </span>
                      {badges.slice(0, 2).map((b, bi) => (
                        <span
                          key={bi}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${b.styleClasses}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(app.updatedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* App Info Grid */}
                  <div className="flex items-start gap-4">
                    <img
                      src={app.icon}
                      alt={`${app.name} Icon`}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {app.developer}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-md">
                          {app.category}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20">
                          v{app.version}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.size}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Changelog Snippet */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <div 
                      onClick={(e) => toggleChangelog(app.id, e)}
                      className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Yang Baru di Versi {app.version}:
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}>
                      {app.whatsNew || 'Pembaruan peningkatan stabilitas performa, perbaikan keamanan sistem, dan optimalisasi kompatibilitas perangkat Android.'}
                    </p>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                    Audit APK Lolos
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onDownloadApp(e, app)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh APK</span>
                    </button>
                    <button
                      onClick={() => onSelectApp(app.slug)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Lihat Halaman Detail"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
