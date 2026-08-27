import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle, X, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialogModal({
  isOpen,
  title,
  message,
  detail,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#151921] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              variant === 'danger'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : variant === 'warning'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
            }`}>
              {variant === 'danger' ? (
                <Trash2 className="h-5 w-5" />
              ) : variant === 'warning' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <HelpCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-[11px] font-bold text-slate-450 dark:text-slate-400 mt-0.5">
                Konfirmasi Tindakan
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {message}
          </p>

          {detail && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
              variant === 'danger'
                ? 'bg-red-500/5 text-red-700 dark:text-red-300 border border-red-500/15'
                : 'bg-slate-50 dark:bg-black/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5'
            }`}>
              {detail}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
