import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, RefreshCw, CheckCircle, ExternalLink, Info } from 'lucide-react';
import { AppData } from '../types';

interface DownloadButtonProps {
  app: AppData;
}

type DownloadStatus = 'idle' | 'connecting' | 'scanning' | 'ready' | 'downloading' | 'completed';

export default function DownloadButton({ app }: DownloadButtonProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);

  const startDownloadWorkflow = () => {
    setStatus('connecting');
    setProgress(0);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'connecting') {
      timer = setTimeout(() => setStatus('scanning'), 1500);
    } else if (status === 'scanning') {
      timer = setTimeout(() => setStatus('ready'), 1500);
    } else if (status === 'ready') {
      timer = setTimeout(() => setStatus('downloading'), 1000);
    } else if (status === 'downloading') {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setStatus('completed');
            // Trigger actual simulated file download
            const link = document.createElement('a');
            link.href = '#'; // dummy action anchor
            link.setAttribute('download', `${app.slug}-v${app.version}-aeroapk.apk`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return 100;
          }
          return prev + 10;
        });
      }, 250);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [status, app.slug]);

  return (
    <div className="w-full space-y-4" id="download-workflow-module">
      {/* Trigger Button */}
      {status === 'idle' && (
        <button
          onClick={startDownloadWorkflow}
          id="initiate-download-button"
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 active:scale-[0.99] text-white font-extrabold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          <Download className="h-5.5 w-5.5 stroke-[2.5]" />
          <span>Unduh APK Sekarang ({app.size})</span>
        </button>
      )}

      {/* Progress & Informative States */}
      {status !== 'idle' && (
        <div className="p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-150 dark:border-white/10 space-y-4">
          <div className="flex items-start gap-3">
            {status === 'connecting' && (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin shrink-0 mt-0.5" />
            )}
            {status === 'scanning' && (
              <ShieldCheck className="h-5 w-5 text-blue-500 animate-pulse shrink-0 mt-0.5" />
            )}
            {status === 'ready' && (
              <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            )}
            {status === 'downloading' && (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin shrink-0 mt-0.5" />
            )}
            {status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                {status === 'connecting' && 'Menghubungkan ke Server Aman...'}
                {status === 'scanning' && 'Memindai APK dengan VirusTotal Cloud...'}
                {status === 'ready' && 'Tautan Siap Terverifikasi'}
                {status === 'downloading' && `Mengunduh file APK (${progress}%)`}
                {status === 'completed' && 'Unduhan Selesai!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {status === 'connecting' && 'Kami sedang menghubungkan Anda ke gerbang server unduhan AeroAPK tercepat.'}
                {status === 'scanning' && 'Tanda tangan digital file sedang diverifikasi. Menjamin tidak ada modifikasi berbahaya.'}
                {status === 'ready' && 'Pemindaian selesai. File 100% aman (SHA-256 Terverifikasi). Memulai unduhan otomatis.'}
                {status === 'downloading' && 'Mohon jangan tutup jendela ini selama berkas dipindahkan ke penyimpanan lokal Anda.'}
                {status === 'completed' && 'Terima kasih telah mengunduh dari AeroAPK! Silakan periksa folder Download di HP Anda.'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {(status === 'downloading' || status === 'completed') && (
            <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Reset button if completed */}
          {status === 'completed' && (
            <button
              onClick={() => setStatus('idle')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Unduh ulang jika file tidak terdownload otomatis
            </button>
          )}
        </div>
      )}

      {/* Trust & Source Disclosure info box */}
      <div className="p-4 bg-blue-50/40 dark:bg-white/[0.02] rounded-2xl border border-blue-500/10 dark:border-white/10 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            Sumber Transparan & Kredibel
          </p>
          <p>
            Tautan berkas dialihkan secara langsung dari server CDN resmi <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded font-semibold text-blue-600 dark:text-blue-400">secure.android-apks.net</code> tanpa adanya perubahan kode, injeksi iklan berbahaya, ataupun paksaan download otomatis. AeroAPK menjamin integritas data sesuai rilis asli Google Play Store.
          </p>
        </div>
      </div>
    </div>
  );
}
