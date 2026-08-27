import React from 'react';
import { Download, Info, ShieldCheck, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/appsData';

interface FooterProps {
  onNavigate: (view: string, slug?: string) => void;
  onCategorySelect: (category: string) => void;
}

export default function Footer({ onNavigate, onCategorySelect }: FooterProps) {
  const infoLinks = [
    { label: 'Tentang Kami', view: 'about' },
    { label: 'Hubungi Kami', view: 'contact' },
    { label: 'Peta Situs', view: 'sitemap' },
    { label: 'Donasi', view: 'donate' }
  ];

  const legalLinks = [
    { label: 'Disclaimer', view: 'disclaimer' },
    { label: 'DMCA / Hak Cipta', view: 'dmca' },
    { label: 'Kebijakan Privasi', view: 'privacy' },
    { label: 'Syarat & Ketentuan', view: 'terms' }
  ];

  return (
    <footer className="bg-[#0F1115]/95 text-slate-400 border-t border-white/10 transition-colors duration-300" id="app-footer">
      {/* Top Main Footer sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand details */}
          <div className="md:col-span-4 space-y-4">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group w-fit"
              onClick={() => onNavigate('home')}
            >
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                AeroAPK
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              AeroAPK adalah surga penyedia berkas Android APK resmi yang didesain secara profesional untuk menjamin kecepatan, keamanan, dan keaslian 100%. Semua file bebas dari virus berbahaya.
            </p>

            <div className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/10 w-fit select-none">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span className="text-[11px] font-bold text-slate-300">VirusTotal Verified & Safe</span>
            </div>
          </div>

          {/* Column 2: Categories mapping */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Kategori Populer
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {CATEGORIES.slice(0, 8).map((cat) => (
                <button
                   key={cat}
                   onClick={() => onCategorySelect(cat)}
                   className="text-left text-slate-450 hover:text-blue-400 transition-colors cursor-pointer truncate font-semibold"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Informational paths */}
          <div className="md:col-span-2.5 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Informasi Utama
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {infoLinks.map((link) => (
                <li key={link.view}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legals mapping */}
          <div className="md:col-span-2.5 space-y-4">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Kebijakan Hukum
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {legalLinks.map((link) => (
                <li key={link.view}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separator */}
        <hr className="my-10 border-white/10" />

        {/* Safety Disclaimer and Legal Text */}
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex items-start gap-3 text-slate-450 text-[11px] leading-relaxed mb-8">
          <Info className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-200">Disclaimer Hukum & DMCA</p>
            <p>
              AeroAPK tidak berafiliasi dengan Google Inc., Google Play Store, ataupun developer aplikasi manapun. Semua merek dagang, aset, logo, dan hak cipta sepenuhnya merupakan milik dari pemilik aslinya yang sah. Kami hanya membagikan berkas APK gratis untuk keperluan pembelajaran. Silakan hubungi kami di menu DMCA apabila terdapat pelanggaran hak cipta agar segera ditindaklanjuti dalam waktu kurang dari 24 jam.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright details */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 border-t border-white/5 pt-6">
          <p>© {new Date().getFullYear()} AeroAPK Downloader. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span>untuk Android Enthusiast Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
