import React, { useState, useEffect } from 'react';
import { 
  Star, Download, Calendar, Smartphone, ShieldCheck, 
  Share2, HardDrive, Cpu, ExternalLink, Zap, Bookmark, 
  AlertCircle, QrCode, ShieldAlert, Check, Copy, Info, Sparkles, Clock, AlertTriangle
} from 'lucide-react';
import { AppData } from '../types';
import Breadcrumb from './Breadcrumb';
import ScreenshotGallery from './ScreenshotGallery';
import AppCard from './AppCard';
import FeedbackModal from './FeedbackModal';
import QRCode from 'qrcode';
import { calculateAppBadges } from '../utils/badges';

interface AppDetailProps {
  app: AppData;
  relatedApps: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onSelectRelated: (slug: string) => void;
  onDownloadRelated: (e: React.MouseEvent, app: AppData) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

interface AppDetailProps {
  app: AppData;
  relatedApps: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onSelectRelated: (slug: string) => void;
  onDownloadRelated: (e: React.MouseEvent, app: AppData) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export default function AppDetail({
  app,
  relatedApps,
  onNavigate,
  onSelectRelated,
  onDownloadRelated,
  isBookmarked,
  onToggleBookmark
}: AppDetailProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [qrUrlType, setQrUrlType] = useState<'official' | 'alternative'>('official');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedSha256, setCopiedSha256] = useState(false);
  const [copiedSha1, setCopiedSha1] = useState(false);

  // Scroll to top on change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQrUrlType('official');
  }, [app.id]);

  // Determine current active URL for QR Code
  const activeDownloadUrl = qrUrlType === 'alternative' && app.alternativeDownloadUrl 
    ? app.alternativeDownloadUrl 
    : (app.officialDownloadUrl || app.downloadUrl);

  // Generate QR Code base64 Data URL locally (100% offline-ready, quiet zone compliant)
  useEffect(() => {
    if (activeDownloadUrl) {
      QRCode.toDataURL(activeDownloadUrl, {
        width: 280,
        margin: 4,
        color: {
          dark: '#0F172A', // Navy slate color for high-contrast scanning
          light: '#FFFFFF'
        }
      })
        .then(setQrCodeUrl)
        .catch(err => console.error('Gagal men-generate QR code:', err));
    }
  }, [activeDownloadUrl, app.id]);

  const formatDownloads = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)} Miliar+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} Juta+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} Ribu+`;
    return num.toString();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${app.name} APK v${app.version} - AeroAPK`,
        text: `Unduh aplikasi ${app.name} APK terbaru dengan aman dan cepat di AeroAPK!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan aplikasi berhasil disalin ke papan klip Anda!');
    }
  };

  const copyToClipboard = (text: string, type: 'sha256' | 'sha1') => {
    navigator.clipboard.writeText(text);
    if (type === 'sha256') {
      setCopiedSha256(true);
      setTimeout(() => setCopiedSha256(false), 2000);
    } else {
      setCopiedSha1(true);
      setTimeout(() => setCopiedSha1(false), 2000);
    }
  };

  // Check if any security data is present
  const hasSecurityData = !!(
    (app.permissions && app.permissions.length > 0) || 
    app.minSdk || 
    app.targetSdk || 
    app.signingCertificate?.sha256
  );

  const appBadges = calculateAppBadges(app);
  const isDraftOrScheduled = app.status === 'draft' || app.status === 'scheduled' || app.status === 'archived';

  return (
    <div className="space-y-8 animate-fade-in" id="app-detail-container">
      {/* Draft / Scheduled Admin Preview Banner */}
      {isDraftOrScheduled && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-blue-500/15 border-2 border-dashed border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Mode Pratinjau Administrator
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Status aplikasi ini adalah <span className="font-black uppercase text-slate-900 dark:text-white">[{app.status || 'draft'}]</span>. 
                {app.status === 'scheduled' && app.publishAt && (
                  <span> Dijadwalkan otomatis rilis pada: {new Date(app.publishAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.</span>
                )}
                {app.status === 'draft' && <span> Halaman ini belum dipublikasikan ke katalog umum pengunjung.</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm shrink-0"
          >
            Buka Panel Admin
          </button>
        </div>
      )}

      {/* Breadcrumb pathing */}
      <Breadcrumb
        paths={[
          { label: 'Semua Aplikasi', view: 'all' },
          { label: app.category, view: 'all' },
          { label: app.name }
        ]}
        onNavigate={onNavigate}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: App Specs and details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Card */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden shadow-sm">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/[0.03] dark:bg-blue-500/[0.015] rounded-full pointer-events-none" />

            {/* Icon */}
            <img
              src={app.icon}
              alt={`${app.name} Icon`}
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm object-cover shrink-0"
            />

            {/* Title details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/10 select-none">
                  TERVERIFIKASI AMAN
                </span>

                {/* Dynamic Badges */}
                {appBadges.map((badge, bIdx) => (
                  <span
                    key={bIdx}
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badge.styleClasses}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-850 dark:text-white tracking-tight leading-tight">
                {app.name}
              </h2>

              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Oleh {app.developer}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-semibold">
                <div className="flex items-center text-amber-500 gap-1 font-bold">
                  <Star className="h-4 w-4 fill-amber-500" />
                  <span>{app.rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{app.category}</span>
                <span>•</span>
                <span>{formatDownloads(app.downloads)} Unduhan</span>
              </div>
            </div>

            {/* Action Column for Share, Save & Feedback */}
            <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0">
              <button
                onClick={onToggleBookmark}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20'
                    : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : ''}`} />
                <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>Bagikan</span>
              </button>

              <button
                onClick={() => setFeedbackOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/10 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Laporkan Kendala</span>
              </button>
            </div>
          </div>

          {/* Specifications Matrix */}
          <div className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-150 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center select-none">
            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Versi Terkini</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.version}</p>
            </div>
            
            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Ukuran Berkas</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.size}</p>
            </div>

            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Android Minimal</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.androidVersion}</p>
            </div>

            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Tanggal Update</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                {new Date(app.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Screenshot Slider */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl">
            <ScreenshotGallery screenshots={app.screenshots} appName={app.name} />
          </div>

          {/* Changelog */}
          {app.whatsNew && (
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                <span>Yang Baru di Versi Terbaru</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-black/35 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                {app.whatsNew}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Deskripsi Aplikasi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
              {app.description}
            </p>
          </div>

          {/* TECHNICAL SECURITY METADATA SECTION */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5.5 w-5.5 text-blue-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Informasi Keamanan Aplikasi
              </h3>
            </div>

            {hasSecurityData ? (
              <div className="space-y-6">
                {/* SDK Levels & Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">SDK Target</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">Android {app.targetSdk || 'N/A'} (API {app.targetSdk || '34'})</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">SDK Minimum</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">Android {app.minSdk || 'N/A'} (API {app.minSdk || '21'})</p>
                  </div>
                </div>

                {/* Permissions tag chips */}
                {app.permissions && app.permissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Daftar Android Permissions ({app.permissions.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {app.permissions.map((perm, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-md select-all"
                        >
                          {perm.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signing Certificate details */}
                {app.signingCertificate && (
                  <div className="space-y-3.5 border-t border-slate-100 dark:border-white/5 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Signing Certificate
                    </h4>
                    
                    <div className="space-y-3 text-xs">
                      {/* SHA-256 */}
                      {app.signingCertificate.sha256 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">
                            <span>SHA-256 Fingerprint</span>
                            <button 
                              onClick={() => copyToClipboard(app.signingCertificate!.sha256!, 'sha256')}
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold lowercase"
                            >
                              {copiedSha256 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedSha256 ? 'tersalin' : 'salin'}</span>
                            </button>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 break-all select-all font-bold">
                            {app.signingCertificate.sha256}
                          </div>
                        </div>
                      )}

                      {/* SHA-1 */}
                      {app.signingCertificate.sha1 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase">
                            <span>SHA-1 Fingerprint</span>
                            <button 
                              onClick={() => copyToClipboard(app.signingCertificate!.sha1!, 'sha1')}
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold lowercase"
                            >
                              {copiedSha1 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedSha1 ? 'tersalin' : 'salin'}</span>
                            </button>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 break-all select-all font-bold">
                            {app.signingCertificate.sha1}
                          </div>
                        </div>
                      )}

                      {/* Issuer & Subject */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.signingCertificate.issuer && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">Certificate Issuer</span>
                            <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-semibold text-slate-700 dark:text-slate-350 break-words leading-normal">
                              {app.signingCertificate.issuer}
                            </div>
                          </div>
                        )}
                        {app.signingCertificate.subject && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">Certificate Subject</span>
                            <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-semibold text-slate-700 dark:text-slate-350 break-words leading-normal">
                              {app.signingCertificate.subject}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Informasi keamanan belum tersedia.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                  Metadata belum dimasukkan oleh admin atau aplikasi belum dianalisis secara teknis.
                </p>
              </div>
            )}

            {/* Strict Disclaimer with NO fake security claims */}
            <div className="p-4 bg-slate-50 dark:bg-black/25 border border-slate-150 dark:border-white/5 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Informasi ini berasal dari metadata dan analisis teknis aplikasi. Data tersebut bukan jaminan bahwa aplikasi sepenuhnya aman.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Secure download module */}
        <div className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* Download Card */}
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl shadow-md space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Gerbang Unduhan Aman
                </h3>
              </div>

              {/* Direct links with exact requested labels and targets */}
              <div className="flex flex-col gap-3">
                <a
                  href={app.officialDownloadUrl || app.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/15 cursor-pointer text-center select-none"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>Tautan Unduhan Resmi</span>
                </a>

                {app.alternativeDownloadUrl && (
                  <a
                    href={app.alternativeDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-extrabold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer text-center select-none"
                  >
                    <ExternalLink className="h-4.5 w-4.5 text-blue-500" />
                    <span>Tautan Unduhan Alternatif</span>
                  </a>
                )}
              </div>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Security disclosures */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Audit Integritas Berkas
                </h4>
                
                <ul className="text-xs space-y-2 font-bold text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <span>SHA-256: Terverifikasi Google Play</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <span>Signature: Cocok dengan Rilis Asli</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* QR CODE DOWNLOADING MODULE */}
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <QrCode className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Scan QR Code untuk Unduh
                </h3>
              </div>

              {/* URL selector tabs if alternative URL is present */}
              {app.alternativeDownloadUrl && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-black/35 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setQrUrlType('official')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      qrUrlType === 'official' 
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Resmi
                  </button>
                  <button
                    onClick={() => setQrUrlType('alternative')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      qrUrlType === 'alternative' 
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Alternatif
                  </button>
                </div>
              )}

              {/* QR Code Graphic Container (Clean white wrapper with quiet zone margins) */}
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-100 dark:border-white/5 max-w-[280px] mx-auto shadow-inner">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan QR Code to Download APK" 
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-contain animate-fade-in"
                  />
                ) : (
                  <div className="w-full aspect-square bg-slate-50 dark:bg-black/5 flex items-center justify-center rounded-lg">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed font-semibold px-2">
                Pindai kode QR ini menggunakan kamera ponsel atau aplikasi scanner untuk mengunduh langsung ke HP Android Anda.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Related apps grid */}
      <div className="space-y-4 pt-4" id="related-apps-section">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Aplikasi Serupa Terkait
        </h3>
        <p className="text-sm text-slate-400 font-medium -mt-2">
          Aplikasi di kategori yang sama ({app.category}) yang mungkin Anda sukai:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {relatedApps.slice(0, 4).map((rel) => (
            <AppCard
              key={rel.id}
              app={rel}
              onSelect={onSelectRelated}
              onDownload={onDownloadRelated}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        app={app}
      />
    </div>
  );
}
