import React, { useState } from 'react';
import { Flame, TrendingUp, Eye, Download, Search, Sparkles, RefreshCw, Star, ArrowUpRight, Award, ShieldCheck, Check } from 'lucide-react';
import { AppData } from '../../types';
import { calculateTrendingScore } from '../../utils/analytics';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TrendingDashboardProps {
  apps: AppData[];
  onRefresh: () => void;
}

export default function TrendingDashboard({ apps, onRefresh }: TrendingDashboardProps) {
  const [updating, setUpdating] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  // Compute trending apps on the fly
  const appsWithScores = apps
    .filter(app => app.status === 'published')
    .map(app => {
      const score = calculateTrendingScore(app);
      return {
        ...app,
        calculatedScore: score
      };
    })
    .sort((a, b) => b.calculatedScore - a.calculatedScore);

  const topTrending = appsWithScores.slice(0, 5);

  const handleSyncScoresToFirestore = async () => {
    setUpdating(true);
    setBoostMessage(null);
    try {
      for (const app of appsWithScores) {
        const docRef = doc(db, 'applications', app.id);
        await updateDoc(docRef, {
          trendingScore: app.calculatedScore,
          'analytics.trendingScore': app.calculatedScore
        });
      }
      setBoostMessage('Skor Trending berhasil dihitung dan disinkronkan ke Firestore!');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setBoostMessage('Gagal sinkron skor: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="trending-dashboard-module">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-150 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard Trending & Popularitas
            </h2>
          </div>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-1">
            Algoritma pembobotan otomatis berdasarkan aktivitas 7 hari: View (1.0x), Klik Resmi (3.0x), Klik Alt (2.0x), Pencarian (1.5x), Lonjakan Terkini (2.5x).
          </p>
        </div>

        <button
          onClick={handleSyncScoresToFirestore}
          disabled={updating}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          {updating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>Hitung Ulang & Sync Skor</span>
        </button>
      </div>

      {boostMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{boostMessage}</span>
        </div>
      )}

      {/* Top 3 Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topTrending.slice(0, 3).map((app, rank) => (
          <div
            key={app.id}
            className="p-5 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] border border-slate-150 dark:border-white/5 rounded-3xl space-y-4 relative overflow-hidden shadow-sm"
          >
            {/* Rank badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase">
              <Award className="h-3.5 w-3.5" />
              <span>Peringkat #{rank + 1}</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={app.icon}
                alt={app.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 shadow-sm"
              />
              <div className="min-w-0 pr-16">
                <h3 className="text-sm font-black text-slate-850 dark:text-white truncate">
                  {app.name}
                </h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold truncate">
                  {app.developer}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-100/70 dark:bg-black/30 rounded-2xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Trending Score:
              </span>
              <span className="text-base font-black text-amber-500 flex items-center gap-1">
                <Flame className="h-4 w-4 fill-amber-500" />
                {app.calculatedScore.toFixed(1)} pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-150 dark:border-white/5">
                <Eye className="h-3 w-3 text-blue-500" />
                <span>{app.analytics?.views || 0} Views</span>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-150 dark:border-white/5">
                <Download className="h-3 w-3 text-green-500" />
                <span>{(app.analytics?.officialClicks || 0) + (app.analytics?.alternativeClicks || 0)} Klik Unduh</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Trending Apps Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Peringkat Lengkap Popularitas Aplikasi
        </h3>

        <div className="border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5">
              <thead className="bg-slate-50 dark:bg-white/[0.02]">
                <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Posisi</th>
                  <th className="py-3 px-4">Aplikasi</th>
                  <th className="py-3 px-4 text-center">Trending Score</th>
                  <th className="py-3 px-4 text-center">Detail Views</th>
                  <th className="py-3 px-4 text-center">Klik Resmi</th>
                  <th className="py-3 px-4 text-center">Klik Alternatif</th>
                  <th className="py-3 px-4 text-center">Pencarian</th>
                  <th className="py-3 px-4 text-center">Lonjakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-700 dark:text-slate-300">
                {appsWithScores.map((app, index) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-mono font-black text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={app.icon}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate">
                          {app.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {app.developer} • <span className="font-bold text-slate-500">{app.category}</span>
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black text-xs">
                        <Flame className="h-3 w-3 fill-amber-500" />
                        {app.calculatedScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {app.analytics?.views || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-green-600 dark:text-green-400">
                      {app.analytics?.officialClicks || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {app.analytics?.alternativeClicks || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                      {app.analytics?.searchFrequency || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{app.analytics?.recentGrowth || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
