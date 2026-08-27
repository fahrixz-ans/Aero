import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, RefreshCw, X, ShieldAlert, Sparkles, Star } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppData, AppStatus } from '../../types';

interface BulkEditModalProps {
  selectedAppIds: string[];
  apps: AppData[];
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkEditModal({
  selectedAppIds,
  apps,
  categories,
  onClose,
  onSuccess
}: BulkEditModalProps) {
  const [targetCategory, setTargetCategory] = useState('');
  const [targetStatus, setTargetStatus] = useState<AppStatus | ''>('');
  const [targetFeatured, setTargetFeatured] = useState<'keep' | 'set-true' | 'set-false'>('keep');
  const [targetPopular, setTargetPopular] = useState<'keep' | 'set-true' | 'set-false'>('keep');
  const [targetDeveloper, setTargetDeveloper] = useState('');
  const [targetAndroidVersion, setTargetAndroidVersion] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [targetUpdatedAt, setTargetUpdatedAt] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedApps = apps.filter(a => selectedAppIds.includes(a.id));

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify at least one field is changed
    const hasChanges = 
      targetCategory !== '' ||
      targetStatus !== '' ||
      targetFeatured !== 'keep' ||
      targetPopular !== 'keep' ||
      targetDeveloper.trim() !== '' ||
      targetAndroidVersion.trim() !== '' ||
      targetVersion.trim() !== '' ||
      targetUpdatedAt.trim() !== '';

    if (!hasChanges) {
      setError('Pilih minimal satu atribut yang ingin diubah secara massal.');
      return;
    }

    if (!window.confirm(`Konfirmasi: Anda akan memperbarui ${selectedAppIds.length} aplikasi sekaligus. Lanjutkan?`)) {
      return;
    }

    setSaving(true);

    try {
      // Chunk batches in groups of 200
      const chunkSize = 200;
      for (let i = 0; i < selectedAppIds.length; i += chunkSize) {
        const chunk = selectedAppIds.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(appId => {
          const docRef = doc(db, 'applications', appId);
          const updates: any = {};

          if (targetCategory) updates.category = targetCategory;
          if (targetStatus) updates.status = targetStatus;
          if (targetFeatured === 'set-true') updates.featured = true;
          if (targetFeatured === 'set-false') updates.featured = false;
          if (targetPopular === 'set-true') updates.popular = true;
          if (targetPopular === 'set-false') updates.popular = false;
          if (targetDeveloper.trim()) updates.developer = targetDeveloper.trim();
          if (targetAndroidVersion.trim()) updates.androidVersion = targetAndroidVersion.trim();
          if (targetVersion.trim()) updates.version = targetVersion.trim();
          if (targetUpdatedAt.trim()) updates.updatedAt = targetUpdatedAt.trim();

          batch.update(docRef, updates);
        });

        await batch.commit();
      }

      onSuccess();
    } catch (err: any) {
      console.error('Bulk edit error:', err);
      setError(`Gagal melakukan edit massal: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#151921] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Bulk Edit ({selectedAppIds.length} Aplikasi Dipilih)
              </h2>
            </div>
            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-0.5">
              Pembaruan serentak untuk kategori, status visibilitas, badge promosi, atau versi rilis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Apps preview pills */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase shrink-0">
            Aplikasi Terpilih:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {selectedApps.slice(0, 5).map(app => (
              <span key={app.id} className="px-2 py-0.5 bg-white dark:bg-white/10 border border-blue-500/20 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-md shrink-0">
                {app.name}
              </span>
            ))}
            {selectedApps.length > 5 && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                +{selectedApps.length - 5} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBulkSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Ubah Kategori
              </label>
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">-- Jangan Ubah Kategori --</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 2. Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Ubah Status Publikasi
              </label>
              <select
                value={targetStatus}
                onChange={e => setTargetStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">-- Jangan Ubah Status --</option>
                <option value="published">Published (Tampil Publik)</option>
                <option value="draft">Draft (Disembunyikan)</option>
                <option value="archived">Archived (Diarsipkan)</option>
              </select>
            </div>

            {/* 3. Featured Badge */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Badge Unggulan (Featured)
              </label>
              <select
                value={targetFeatured}
                onChange={e => setTargetFeatured(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="keep">-- Pertahankan Status Asli --</option>
                <option value="set-true">Set Menjadi Unggulan (True)</option>
                <option value="set-false">Hapus dari Unggulan (False)</option>
              </select>
            </div>

            {/* 4. Popular Badge */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Badge Populer (Popular)
              </label>
              <select
                value={targetPopular}
                onChange={e => setTargetPopular(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="keep">-- Pertahankan Status Asli --</option>
                <option value="set-true">Set Menjadi Populer (True)</option>
                <option value="set-false">Hapus dari Populer (False)</option>
              </select>
            </div>

            {/* 5. Developer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Nama Developer Baru
              </label>
              <input
                type="text"
                value={targetDeveloper}
                onChange={e => setTargetDeveloper(e.target.value)}
                placeholder="Kosongkan jika tidak ingin diubah"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </div>

            {/* 6. Min Android OS */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Min. OS Android Target
              </label>
              <input
                type="text"
                value={targetAndroidVersion}
                onChange={e => setTargetAndroidVersion(e.target.value)}
                placeholder="Contoh: Android 6.0+"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </div>

            {/* 7. Update Date */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Perbarui Tanggal Rilis / Updated At
              </label>
              <input
                type="date"
                value={targetUpdatedAt}
                onChange={e => setTargetUpdatedAt(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Perubahan ini akan diterapkan serentak ke {selectedAppIds.length} dokumen aplikasi di Cloud Firestore.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-150 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Memperbarui Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Terapkan Perubahan Massal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
