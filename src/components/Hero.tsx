import React from 'react';
import { Search, Shield, Zap, Sparkles, Flame } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onTagClick: (tag: string) => void;
  onExploreClick: () => void;
}

export default function Hero({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onTagClick,
  onExploreClick
}: HeroProps) {
  const popularTags = ['WhatsApp', 'CapCut', 'Instagram', 'Spotify', 'Mobile Legends'];

  return (
    <div className="relative overflow-hidden py-14 px-6 md:py-16 border border-slate-200 dark:border-white/10 rounded-3xl bg-gradient-to-br from-blue-800 to-indigo-950 text-white shadow-2xl" id="hero-section">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 dark:bg-blue-950/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-950/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text and Search panel */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 font-semibold text-xs tracking-wide uppercase select-none animate-pulse">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 fill-blue-400/20" />
              <span>Unduhan Aman & Bebas Iklan Palsu</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08] font-sans">
              Discover Apps.<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Download Smarter.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-250 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Temukan dan unduh file APK resmi terlengkap secara instan. Semua aplikasi diperiksa secara ketat oleh sistem antivirus kami untuk menjamin keamanan 100%.
            </p>

            {/* Main Search Bar */}
            <form onSubmit={onSearchSubmit} className="max-w-xl mx-auto lg:mx-0 mt-8" id="hero-search-form">
              <div className="relative flex items-center p-1.5 bg-white/10 dark:bg-black/35 backdrop-blur-md border border-slate-200/20 dark:border-white/15 rounded-2xl shadow-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <div className="pl-3.5 text-slate-300 shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama aplikasi, developer, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-2.5 pr-4 py-3 bg-transparent text-white placeholder-slate-300 text-sm md:text-base font-semibold focus:outline-none"
                  id="hero-search-input"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-blue-600/25 cursor-pointer"
                  id="hero-search-submit"
                >
                  Cari APK
                </button>
              </div>
            </form>

            {/* Popular tags suggestion */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/10" />
                Populer:
              </span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-blue-500/15 text-slate-200 hover:text-blue-400 font-semibold cursor-pointer transition-colors border border-white/5 hover:border-blue-500/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Visual Representation */}
          <div className="hidden lg:col-span-5 lg:flex justify-center relative select-none">
            {/* Main Phone visual representation */}
            <div className="relative w-72 h-[450px] bg-slate-900 dark:bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-slate-900 rounded-full" />
              </div>

              {/* Dynamic screen content */}
              <div className="flex-1 bg-slate-950 p-4 pt-10 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Mock app detail */}
                  <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      W
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-3 bg-slate-700 rounded w-4/5" />
                      <div className="h-2 bg-slate-800 rounded w-1/2 mt-1.5" />
                    </div>
                  </div>

                  {/* Trust check element */}
                  <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/10 flex gap-2.5">
                    <Shield className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="h-2.5 bg-blue-900/40 rounded w-12" />
                      <div className="h-1.5 bg-slate-700 rounded w-28" />
                    </div>
                  </div>
                </div>

                {/* Simulated downloading progress button */}
                <div className="p-3 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-300">Unduhan Instan</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400">100% Aman</span>
                </div>
              </div>
            </div>

            {/* floating absolute elements */}
            <div className="absolute top-8 -left-8 p-3 bg-slate-900 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2.5 select-none animate-bounce" style={{ animationDuration: '6s' }}>
              <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold">VERIFIKASI</p>
                <p className="text-xs text-white font-extrabold -mt-0.5">SHA-256 Aman</p>
              </div>
            </div>

            <div className="absolute bottom-12 -right-8 p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2.5 select-none animate-bounce" style={{ animationDuration: '8s' }}>
              <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                <Flame className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold">SANGAT CEPAT</p>
                <p className="text-xs text-white font-extrabold -mt-0.5">Tanpa Limit Speed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
