import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { AppData } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppData;
}

export default function FeedbackModal({ isOpen, onClose, app }: FeedbackModalProps) {
  const [reportType, setReportType] = useState('Tautan Unduhan Resmi rusak');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam honeypot
  
  // Math challenge spam protection
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Generate math puzzle when modal opens
  useEffect(() => {
    if (isOpen) {
      setNumA(Math.floor(Math.random() * 9) + 2);
      setNumB(Math.floor(Math.random() * 8) + 2);
      setMathAnswer('');
      setMathError(false);
      setSubmitted(false);
      setMessage('');
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMathError(false);

    // 1. Bot honeypot check
    if (honeypot) {
      console.warn('Bot detected via honeypot.');
      onClose();
      return;
    }

    // 2. Input validation
    if (!message.trim()) {
      setError('Mohon tuliskan pesan atau deskripsi kendala Anda.');
      return;
    }

    // 3. Spam protection: Math check
    const correctAnswer = numA + numB;
    if (parseInt(mathAnswer.trim(), 10) !== correctAnswer) {
      setMathError(true);
      return;
    }

    setLoading(true);

    try {
      // Create feedback object in Firestore
      const feedbackCollectionRef = collection(db, 'feedback');
      
      const newFeedback = {
        applicationId: app.id,
        applicationName: app.name,
        type: reportType,
        message: message.trim(),
        email: email.trim() || null,
        status: 'new',
        createdAt: serverTimestamp()
      };

      await addDoc(feedbackCollectionRef, newFeedback);
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError('Terjadi kesalahan sistem saat mengirim laporan Anda. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#15181F] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Laporkan Kendala Aplikasi
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              Membantu kami menjaga kestabilan sistem rilis {app.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <CheckCircle className="h-14 w-14 text-blue-500 mx-auto animate-bounce" />
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Feedback Terkirim!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-semibold">
                Terima kasih atas partisipasi Anda. Tim AeroAPK akan menindaklanjuti laporan Anda secepat mungkin.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Honeypot field for spam prevention (invisible to users) */}
            <input
              type="text"
              name="website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              style={{ display: 'none' }}
              autoComplete="off"
              tabIndex={-1}
            />

            {/* Application Identifier Label */}
            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-semibold">
              Aplikasi: <span className="text-blue-600 dark:text-blue-400 font-black">{app.name}</span> (v{app.version})
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2 font-bold animate-pulse">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Report Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Jenis Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
              >
                <option value="Tautan Unduhan Resmi rusak">Tautan Unduhan Resmi rusak</option>
                <option value="Tautan Unduhan Alternatif rusak">Tautan Unduhan Alternatif rusak</option>
                <option value="Versi aplikasi sudah outdated">Versi aplikasi sudah outdated</option>
                <option value="Informasi aplikasi tidak sesuai">Informasi aplikasi tidak sesuai</option>
                <option value="Screenshot tidak sesuai">Screenshot tidak sesuai</option>
                <option value="Masalah lainnya">Masalah lainnya</option>
              </select>
            </div>

            {/* Message/Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Rincian Pesan / Deskripsi Laporan
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Jelaskan secara singkat kerusakan tautan atau rincian versi baru yang Anda temukan..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Alamat Email Anda
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Opsional</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com (Untuk update perbaikan)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Math challenge basic anti-spam protection */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-blue-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Selesaikan Tantangan: Berapakah <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{numA} + {numB}</strong>?
                </span>
              </div>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                placeholder="Jawaban"
                className={`w-24 px-3 py-2 bg-slate-50 dark:bg-black/35 border rounded-xl text-xs text-center text-slate-800 dark:text-white focus:outline-none ${
                  mathError ? 'border-red-500 animate-shake' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'
                }`}
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
