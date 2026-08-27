import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);

  // Keep subscriber list in memory for simulation
  const [subscribers, setSubscribers] = useState<string[]>([
    'test@gmail.com',
    'admin@aeroapk.com'
  ]);

  const validateEmail = (value: string) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    // Simulate database network lag
    setTimeout(() => {
      const lowerEmail = email.trim().toLowerCase();
      if (subscribers.includes(lowerEmail)) {
        setStatus('duplicate');
      } else {
        setSubscribers((prev) => [...prev, lowerEmail]);
        setStatus('success');
        setEmail('');
      }
    }, 1200);
  };

  const handleUnsubscribeSimulation = (emailToUnsub: string) => {
    const lowerEmail = emailToUnsub.trim().toLowerCase();
    if (subscribers.includes(lowerEmail)) {
      setSubscribers((prev) => prev.filter((e) => e !== lowerEmail));
      alert(`Email ${emailToUnsub} berhasil dihapus dari daftar newsletter kami.`);
      setShowUnsubscribe(false);
    } else {
      alert(`Email ${emailToUnsub} tidak terdaftar di sistem kami.`);
    }
  };

  return (
    <div className="relative py-12 px-6 sm:px-10 bg-gradient-to-br from-blue-950/95 via-blue-900 to-indigo-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10" id="newsletter-section">
      {/* Decorative vectors */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left header */}
        <div className="space-y-3 max-w-md text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Stay Updated</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Update Aplikasi Terbaik
          </h3>
          <p className="text-sm text-blue-100/70 font-medium leading-relaxed">
            Dapatkan informasi update aplikasi Android terbaru, artikel keamanan, dan tips menarik langsung di email Anda. Tanpa spam.
          </p>
        </div>

        {/* Right form input */}
        <div className="w-full max-w-md space-y-3">
          <form onSubmit={handleSubscribe} className="relative flex items-center p-1 bg-white/10 dark:bg-black/10 rounded-2xl border border-white/10 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all">
            <div className="pl-4 text-blue-300">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              placeholder="Masukkan alamat email Anda..."
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              className="w-full pl-3 pr-4 py-3.5 bg-transparent text-white placeholder-blue-100/50 text-sm font-semibold focus:outline-none"
              id="newsletter-email-input"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all duration-150 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              id="newsletter-subscribe-button"
            >
              {status === 'loading' ? 'Loading...' : 'Subscribe'}
            </button>
          </form>

          {/* Feedback message display */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 p-2.5 bg-blue-950/40 rounded-xl border border-blue-500/20 animate-fade-in">
              <Check className="h-4 w-4 shrink-0" />
              <span>Pendaftaran berhasil! Periksa kotak masuk Anda untuk konfirmasi awal.</span>
            </div>
          )}

          {status === 'duplicate' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 p-2.5 bg-amber-950/40 rounded-xl border border-amber-500/20 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Email ini sudah terdaftar sebelumnya dalam database kami.</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-300 p-2.5 bg-red-950/40 rounded-xl border border-red-500/20 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Silakan masukkan format alamat email yang benar.</span>
            </div>
          )}

          {/* Unsubscribe support instructions */}
          <div className="text-center md:text-right pt-1.5">
            <button
              onClick={() => setShowUnsubscribe(!showUnsubscribe)}
              className="text-[11px] text-blue-200/60 hover:text-white hover:underline cursor-pointer font-semibold transition-colors"
              id="newsletter-unsubscribe-trigger"
            >
              Ingin berhenti berlangganan? Klik di sini
            </button>

            {showUnsubscribe && (
              <div className="mt-2.5 p-3 bg-black/35 rounded-xl border border-white/5 space-y-2 text-left animate-fade-in">
                <p className="text-[10px] text-slate-300">
                  Masukkan email terdaftar untuk menghapus dari database kami secara instan:
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    id="unsub-email"
                    placeholder="Email yang ingin dihapus..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-400"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('unsub-email') as HTMLInputElement;
                      if (input && input.value) {
                        handleUnsubscribeSimulation(input.value);
                      }
                    }}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
