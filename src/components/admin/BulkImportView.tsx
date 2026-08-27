import React, { useState } from 'react';
import { Upload, FileJson, CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, FileText, Check, AlertCircle, Sparkles, Download } from 'lucide-react';
import { collection, writeBatch, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppData, ImportJob } from '../../types';

interface BulkImportViewProps {
  user: any;
  categories: string[];
  existingApps: AppData[];
  onImportComplete: () => void;
  onCancel: () => void;
}

interface ValidationItem {
  index: number;
  original: any;
  isValid: boolean;
  errors: string[];
  sanitizedApp?: AppData;
}

export default function BulkImportView({
  user,
  categories,
  existingApps,
  onImportComplete,
  onCancel
}: BulkImportViewProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationItem[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    details: string[];
  } | null>(null);

  // Sample JSON Template for user reference
  const sampleJson = `[
  {
    "name": "WhatsApp Messenger",
    "slug": "whatsapp-messenger",
    "developer": "WhatsApp LLC",
    "category": "Komunikasi",
    "version": "2.24.18.75",
    "size": "58.4 MB",
    "androidVersion": "Android 5.0+",
    "rating": 4.6,
    "downloads": 5000000000,
    "officialDownloadUrl": "https://www.whatsapp.com/android/WhatsApp.apk",
    "alternativeDownloadUrl": "https://cdn.aeroapk.com/apks/whatsapp-2-24-18-75.apk",
    "icon": "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=200&h=200&fit=crop&q=80",
    "description": "WhatsApp dari Meta adalah aplikasi perpesanan dan panggilan video gratis yang aman dan andal.",
    "whatsNew": "Peningkatan performa dan perbaikan bug untuk panggilan grup.",
    "status": "published",
    "featured": true,
    "popular": true
  }
]`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      validateJsonString(text, file.name);
    };
    reader.readAsText(file);
  };

  const validateJsonString = (rawJson: string, nameOfFile = 'input.json') => {
    setValidating(true);
    setValidationResults(null);
    setImportSummary(null);

    try {
      if (!rawJson.trim()) {
        throw new Error('Data JSON kosong. Silakan unggah file JSON atau tempel teks JSON.');
      }

      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Format JSON tidak valid: Root harus berupa array [] dari objek aplikasi.');
      }

      const existingSlugs = new Set(existingApps.map(a => a.slug?.toLowerCase()).filter(Boolean));
      const batchSlugs = new Set<string>();
      const results: ValidationItem[] = [];

      parsed.forEach((item: any, idx: number) => {
        const errors: string[] = [];

        // Required field validation
        if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
          errors.push('Nama aplikasi (name) wajib diisi.');
        }

        if (!item.developer || typeof item.developer !== 'string' || !item.developer.trim()) {
          errors.push('Nama pengembang (developer) wajib diisi.');
        }

        const category = item.category || item.categoryId || 'Utilities';
        if (!category) {
          errors.push('Kategori (category) wajib diisi.');
        }

        if (!item.version || typeof item.version !== 'string') {
          errors.push('Versi aplikasi (version) wajib diisi.');
        }

        if (!item.size || typeof item.size !== 'string') {
          errors.push('Ukuran berkas (size) wajib diisi.');
        }

        if (!item.androidVersion || typeof item.androidVersion !== 'string') {
          errors.push('Versi Android (androidVersion) wajib diisi.');
        }

        // Validate official download URL (must be valid HTTPS URL)
        const officialUrl = item.officialDownloadUrl || item.downloadUrl;
        if (!officialUrl || typeof officialUrl !== 'string') {
          errors.push('Tautan unduhan resmi (officialDownloadUrl) wajib diisi.');
        } else if (!officialUrl.startsWith('https://') && !officialUrl.startsWith('http://')) {
          errors.push('Tautan unduhan resmi harus berupa URL web yang valid (https://...).');
        }

        // Validate slug formatting and uniqueness
        let slug = (item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''))
          .toLowerCase()
          .replace(/^-+|-+$/g, '');

        if (!slug) {
          errors.push('Slug tidak valid.');
        } else if (!/^[a-z0-9-]+$/.test(slug)) {
          errors.push('Slug hanya boleh mengandung huruf kecil, angka, dan tanda hubung (-).');
        } else if (batchSlugs.has(slug)) {
          errors.push(`Duplikasi slug dalam file JSON ini: "${slug}".`);
        } else {
          batchSlugs.add(slug);
        }

        // Construct sanitized AppData if valid
        let sanitizedApp: AppData | undefined = undefined;
        if (errors.length === 0) {
          const appId = item.id || `app-${slug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          sanitizedApp = {
            id: appId,
            name: item.name.trim(),
            slug: slug,
            developer: item.developer.trim(),
            category: category,
            version: item.version.trim(),
            size: item.size.trim(),
            androidVersion: item.androidVersion.trim(),
            rating: typeof item.rating === 'number' ? item.rating : 4.5,
            downloads: typeof item.downloads === 'number' ? item.downloads : 10000,
            releaseDate: item.releaseDate || new Date().toISOString().split('T')[0],
            updatedAt: item.updatedAt || new Date().toISOString().split('T')[0],
            downloadUrl: officialUrl,
            officialDownloadUrl: officialUrl,
            alternativeDownloadUrl: item.alternativeDownloadUrl || '',
            icon: item.icon || 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=128&h=128&fit=crop&q=80',
            screenshots: Array.isArray(item.screenshots) && item.screenshots.length > 0
              ? item.screenshots
              : [
                  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=800&fit=crop&q=80'
                ],
            description: item.description || `Unduh ${item.name} versi terbaru untuk Android di AeroAPK.`,
            whatsNew: item.whatsNew || 'Peningkatan kestabilan performa dan keamanan.',
            featured: Boolean(item.featured),
            popular: Boolean(item.popular),
            status: item.status === 'draft' || item.status === 'scheduled' || item.status === 'archived' ? item.status : 'published',
            publishMode: item.publishMode || 'immediate',
            publishAt: item.publishAt || null,
            permissions: Array.isArray(item.permissions) ? item.permissions : ['INTERNET', 'ACCESS_NETWORK_STATE'],
            minSdk: item.minSdk || 21,
            targetSdk: item.targetSdk || 34,
            signingCertificate: item.signingCertificate || {
              sha256: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA',
              sha1: '11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22',
              issuer: `CN=${item.developer || 'Android Release'}, O=${item.developer || 'Developer'}`,
              subject: `CN=${item.name}, O=${item.developer || 'Developer'}`
            },
            analytics: {
              views: item.analytics?.views || 0,
              officialClicks: item.analytics?.officialClicks || 0,
              alternativeClicks: item.analytics?.alternativeClicks || 0,
              searchFrequency: item.analytics?.searchFrequency || 0,
              recentGrowth: item.analytics?.recentGrowth || 0,
              lastInteractionAt: new Date().toISOString()
            }
          };
        }

        results.push({
          index: idx + 1,
          original: item,
          isValid: errors.length === 0,
          errors,
          sanitizedApp
        });
      });

      setValidationResults(results);
    } catch (err: any) {
      alert(`Gagal validasi JSON: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResults) return;

    const validItems = validationResults.filter(r => r.isValid && r.sanitizedApp);
    if (validItems.length === 0) {
      alert('Tidak ada item valid yang dapat diimpor.');
      return;
    }

    if (!window.confirm(`Konfirmasi: Apakah Anda yakin ingin mengimpor ${validItems.length} aplikasi ke Cloud Firestore?`)) {
      return;
    }

    setImporting(true);
    setImportProgress(0);

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const detailLogs: string[] = [];

    try {
      // Chunk items into Firestore batch batches of max 250 (Firestore limit is 500)
      const chunkSize = 200;
      for (let i = 0; i < validItems.length; i += chunkSize) {
        const chunk = validItems.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const app = item.sanitizedApp!;
          const docRef = doc(db, 'applications', app.id);
          batch.set(docRef, app);
        });

        await batch.commit();
        importedCount += chunk.length;
        setImportProgress(Math.round((importedCount / validItems.length) * 100));
      }

      const invalidCount = validationResults.length - validItems.length;
      skippedCount = invalidCount;

      validationResults.forEach(res => {
        if (!res.isValid) {
          detailLogs.push(`[Lewati Baris ${res.index}] ${res.original?.name || 'Aplikasi'}: ${res.errors.join(', ')}`);
        } else {
          detailLogs.push(`[Sukses Baris ${res.index}] ${res.sanitizedApp?.name} (ID: ${res.sanitizedApp?.id})`);
        }
      });

      // Save Import Job history record to Firestore
      try {
        const importJobData: ImportJob = {
          id: `job-${Date.now()}`,
          adminId: user?.uid || 'admin-system',
          adminEmail: user?.email || 'admin@aeroapk.com',
          fileName: fileName || 'bulk-import.json',
          totalItems: validationResults.length,
          importedItems: importedCount,
          skippedItems: skippedCount,
          failedItems: failedCount,
          errors: detailLogs.filter(l => l.startsWith('[Lewati')),
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'importJobs'), {
          ...importJobData,
          timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn('Failed to record import job in history collection:', logErr);
      }

      setImportSummary({
        total: validationResults.length,
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount,
        details: detailLogs
      });
    } catch (err: any) {
      console.error('Import execution error:', err);
      alert(`Terjadi kesalahan saat mengimpor ke Firestore: ${err.message}`);
      failedCount++;
    } finally {
      setImporting(false);
    }
  };

  const validCount = validationResults ? validationResults.filter(r => r.isValid).length : 0;
  const invalidCount = validationResults ? validationResults.filter(r => !r.isValid).length : 0;

  return (
    <div className="space-y-6 animate-fade-in" id="bulk-import-module">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-150 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileJson className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Bulk Import Applications (JSON)
            </h2>
          </div>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-1">
            Impor puluhan atau ratusan metadata aplikasi sekaligus menggunakan format JSON terverifikasi.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all"
        >
          Kembali ke Kelola Aplikasi
        </button>
      </div>

      {/* Step 1: Input & Upload File */}
      {!importSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  1. Pilih Berkas JSON atau Tempel Teks
                </span>
                {fileName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md truncate max-w-[200px]">
                    {fileName}
                  </span>
                )}
              </div>

              {/* Drag & Drop Upload Zone */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl cursor-pointer bg-white dark:bg-black/20 transition-all group">
                <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-500">
                  Klik untuk Memilih File .json
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  Atau seret dan lepas berkas JSON Anda di area ini
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Raw JSON TextArea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                  Atau Tempel Kode JSON Langsung:
                </label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="[\n  {\n    &quot;name&quot;: &quot;WhatsApp&quot;,\n    &quot;slug&quot;: &quot;whatsapp&quot;,\n    ...\n  }\n]"
                  className="w-full p-3 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => validateJsonString(jsonInput, 'pasted-data.json')}
                  disabled={validating || !jsonInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-2 shadow-md shadow-blue-500/10"
                >
                  {validating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Validasi & Preview Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines and Sample Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Struktur Schema Wajib
                </h3>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 font-semibold list-disc pl-4">
                <li><strong className="text-slate-800 dark:text-slate-200">name</strong> (string): Nama aplikasi</li>
                <li><strong className="text-slate-800 dark:text-slate-200">developer</strong> (string): Nama pengembang</li>
                <li><strong className="text-slate-800 dark:text-slate-200">category</strong> (string): Kategori aplikasi</li>
                <li><strong className="text-slate-800 dark:text-slate-200">version</strong> (string): Nomor versi (cth: "1.0.0")</li>
                <li><strong className="text-slate-800 dark:text-slate-200">size</strong> (string): Ukuran file (cth: "45 MB")</li>
                <li><strong className="text-slate-800 dark:text-slate-200">androidVersion</strong> (string): Versi Android minimal</li>
                <li><strong className="text-slate-800 dark:text-slate-200">officialDownloadUrl</strong> (string URL): Link APK langsung</li>
                <li><strong className="text-slate-800 dark:text-slate-200">slug</strong> (string opsional): ID URL unik</li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput(sampleJson);
                    validateJsonString(sampleJson, 'sample-template.json');
                  }}
                  className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Muat Contoh Format JSON Valid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Validation Results Table & Preview */}
      {validationResults && !importSummary && (
        <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-white/5 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Hasil Validasi Schema ({validationResults.length} Item Terdeteksi)
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-0.5">
                Periksa daftar aplikasi di bawah sebelum melanjutkan proses import ke database Firestore.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                <span>{validCount} Siap Diimpor</span>
              </span>
              {invalidCount > 0 && (
                <span className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{invalidCount} Gagal Validasi</span>
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-black/20">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5">
                <thead className="bg-slate-50 dark:bg-white/[0.02] sticky top-0">
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Nama Aplikasi</th>
                    <th className="py-2.5 px-3">Developer</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Versi & Ukuran</th>
                    <th className="py-2.5 px-3">Keterangan / Kendala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-700 dark:text-slate-300">
                  {validationResults.map((item) => (
                    <tr
                      key={item.index}
                      className={item.isValid ? 'hover:bg-slate-50/50 dark:hover:bg-white/[0.01]' : 'bg-red-500/5'}
                    >
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{item.index}</td>
                      <td className="py-2.5 px-3">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20">
                            <Check className="h-2.5 w-2.5" /> VALID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20">
                            <XCircle className="h-2.5 w-2.5" /> ERROR
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                        {item.original?.name || '(Tanpa Nama)'}
                        {item.sanitizedApp?.slug && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            slug: {item.sanitizedApp.slug}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{item.original?.developer || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] rounded-md font-black">
                          {item.original?.category || item.original?.categoryId || 'Utilities'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.original?.version || '-'} • {item.original?.size || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[10px]">
                        {item.isValid ? (
                          <span className="text-green-500 font-medium">Siap ditambahkan</span>
                        ) : (
                          <ul className="text-red-500 space-y-0.5 list-disc pl-3 font-bold">
                            {item.errors.map((err, eIdx) => (
                              <li key={eIdx}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl">
            <div className="text-xs text-slate-500 font-semibold">
              Hanya item dengan status <strong>VALID</strong> ({validCount} aplikasi) yang akan disimpan ke Firestore.
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setValidationResults(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Validasi
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || validCount === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Konfirmasi & Import {validCount} Aplikasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success Report Summary */}
      {importSummary && (
        <div className="space-y-6 p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-3xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Proses Import Aplikasi Selesai!
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-0.5">
                Data telah berhasil disinkronkan ke Cloud Firestore database.
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-black/30 rounded-2xl border border-slate-150 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Terbaca</span>
              <p className="text-xl font-black text-slate-800 dark:text-white">{importSummary.total}</p>
            </div>
            <div className="p-4 bg-white dark:bg-black/30 rounded-2xl border border-green-500/20 space-y-1">
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Berhasil Diimpor</span>
              <p className="text-xl font-black text-green-500">{importSummary.imported}</p>
            </div>
            <div className="p-4 bg-white dark:bg-black/30 rounded-2xl border border-amber-500/20 space-y-1">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Dilewati (Invalid)</span>
              <p className="text-xl font-black text-amber-500">{importSummary.skipped}</p>
            </div>
            <div className="p-4 bg-white dark:bg-black/30 rounded-2xl border border-red-500/20 space-y-1">
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Gagal System</span>
              <p className="text-xl font-black text-red-500">{importSummary.failed}</p>
            </div>
          </div>

          {/* Detail Logs */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              Rincian Log Transaksi:
            </span>
            <div className="p-4 bg-white dark:bg-black/40 border border-slate-150 dark:border-white/5 rounded-2xl max-h-48 overflow-y-auto text-xs font-mono font-semibold space-y-1">
              {importSummary.details.map((log, idx) => (
                <p
                  key={idx}
                  className={log.startsWith('[Sukses') ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}
                >
                  {log}
                </p>
              ))}
            </div>
          </div>

          {/* Finished buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setJsonInput('');
                setFileName('');
                setValidationResults(null);
                setImportSummary(null);
              }}
              className="px-4 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Import Berkas Lain
            </button>
            <button
              onClick={onImportComplete}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer"
            >
              Selesai & Lihat Daftar Aplikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
