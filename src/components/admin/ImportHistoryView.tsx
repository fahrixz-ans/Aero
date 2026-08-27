import React, { useState, useEffect } from 'react';
import { History, FileJson, CheckCircle2, AlertTriangle, Clock, RefreshCw, User, FileText } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ImportJob } from '../../types';

export default function ImportHistoryView() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'importJobs'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const list: ImportJob[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ImportJob);
      });
      setJobs(list);
    } catch (err) {
      console.warn('Could not fetch import jobs with order, trying simple get:', err);
      try {
        const snapshot = await getDocs(collection(db, 'importJobs'));
        const list: ImportJob[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ImportJob);
        });
        setJobs(list.reverse());
      } catch (fallbackErr) {
        console.error('Import history load error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" id="import-history-module">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Riwayat Bulk Import JSON
            </h2>
          </div>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-1">
            Log rekaman semua aktivitas impor berkas JSON yang telah dijalankan oleh administrator.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
          title="Segarkan Riwayat"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-2 animate-pulse">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-450 font-semibold">Memuat riwayat import dari Cloud Firestore...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-2">
          <FileJson className="h-8 w-8 text-slate-400 mx-auto opacity-50" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada riwayat impor JSON tercatat.</p>
          <p className="text-[11px] text-slate-400">Jalankan Bulk Import untuk melihat riwayat proses di sini.</p>
        </div>
      ) : (
        <div className="border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5">
              <thead className="bg-slate-50 dark:bg-white/[0.02]">
                <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu Impor</th>
                  <th className="py-3 px-4">Nama Berkas</th>
                  <th className="py-3 px-4">Operator / Admin</th>
                  <th className="py-3 px-4 text-center">Total Item</th>
                  <th className="py-3 px-4 text-center">Berhasil</th>
                  <th className="py-3 px-4 text-center">Dilewati</th>
                  <th className="py-3 px-4 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-700 dark:text-slate-300">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleString('id-ID')
                        : 'Baru saja'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileJson className="h-3.5 w-3.5 text-blue-500" />
                      <span>{job.fileName}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {job.adminEmail || 'admin@aeroapk.com'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {job.totalItems}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md font-black text-[10px]">
                        +{job.importedItems}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {job.skippedItems > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md font-black text-[10px]">
                          {job.skippedItems}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                      >
                        Lihat Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-[#151921] rounded-3xl border border-slate-150 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Rincian Pekerjaan Impor #{selectedJob.id}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Berkas: {selectedJob.fileName} • Operator: {selectedJob.adminEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl">
                <span className="text-[9.5px] text-slate-400 uppercase font-black">Total Data</span>
                <p className="text-lg font-black text-slate-800 dark:text-white">{selectedJob.totalItems}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-2xl">
                <span className="text-[9.5px] text-green-500 uppercase font-black">Berhasil</span>
                <p className="text-lg font-black text-green-500">{selectedJob.importedItems}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <span className="text-[9.5px] text-amber-500 uppercase font-black">Dilewati</span>
                <p className="text-lg font-black text-amber-500">{selectedJob.skippedItems}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                Log Catatan & Peringatan:
              </span>
              <div className="p-3 bg-slate-50 dark:bg-black/40 border border-slate-150 dark:border-white/5 rounded-2xl max-h-48 overflow-y-auto text-xs font-mono space-y-1">
                {selectedJob.errors && selectedJob.errors.length > 0 ? (
                  selectedJob.errors.map((err, i) => (
                    <p key={i} className="text-amber-500">{err}</p>
                  ))
                ) : (
                  <p className="text-green-500 font-semibold">Semua item berhasil diimpor tanpa kesalahan validasi.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
