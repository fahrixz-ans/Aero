import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Edit3, Trash2, ShieldAlert, CheckCircle, 
  Clock, HelpCircle, FileText, Smartphone, Mail, Settings, 
  Grid, RefreshCw, Upload, Eye, EyeOff, Save, Check, Copy, AlertCircle, TrendingUp, Info,
  FileJson, History, Flame, Layers, Calendar, Sparkles, ExternalLink, Filter,
  FolderPlus, FolderMinus, Tag, Folder, Hash, ArrowRight, CheckCircle2
} from 'lucide-react';
import { AppData, AppStatus, PublishMode } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, 
  query, orderBy, addDoc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { appsData as staticApps } from '../data/appsData';
import { calculateAppBadges } from '../utils/badges';
import { 
  addDeletedAppId, 
  addDeletedAppIds, 
  getDeletedAppIds 
} from '../utils/appStorage';
import { 
  loadAllCategories, 
  addCategoryToDb, 
  deleteCategoryFromDb, 
  renameCategoryInDb 
} from '../services/categoryService';
import ConfirmDialogModal from './admin/ConfirmDialogModal';
import BulkImportView from './admin/BulkImportView';
import BulkEditModal from './admin/BulkEditModal';
import TrendingDashboard from './admin/TrendingDashboard';
import ImportHistoryView from './admin/ImportHistoryView';

interface AdminPanelProps {
  onNavigate: (view: string, slug?: string) => void;
  user: any;
}

type AdminTab = 'dashboard' | 'applications' | 'import' | 'import-history' | 'trending' | 'feedback' | 'newsletter' | 'categories';

export default function AdminPanel({ onNavigate, user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [apps, setApps] = useState<AppData[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bulk operations state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');

  // App Editor Form State
  const [editingApp, setEditingApp] = useState<AppData | null>(null);
  const [isNewApp, setIsNewApp] = useState(false);
  
  // Custom temporary fields for arrays
  const [tempPermissions, setTempPermissions] = useState('');
  const [tempScreenshots, setTempScreenshots] = useState('');

  // APK file analysis state
  const [analyzingApk, setAnalyzingApk] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Feedback filter state
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState<string>('all');
  const [feedbackFilterType, setFeedbackFilterType] = useState<string>('all');

  // Categories management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Reusable In-App Confirmation Dialog State (eliminates window.confirm in iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Load all data from Firestore + LocalStorage
  const loadAllData = async () => {
    setLoading(true);
    try {
      const deletedIds = getDeletedAppIds();

      // 1. Load Applications
      const appsSnapshot = await getDocs(collection(db, 'applications'));
      let loadedApps: AppData[] = [];
      appsSnapshot.forEach((doc) => {
        if (!deletedIds.includes(doc.id)) {
          loadedApps.push({ id: doc.id, ...doc.data() } as AppData);
        }
      });

      // If Firestore is empty, fallback to static data filtered by deleted IDs
      if (loadedApps.length === 0) {
        setApps(staticApps.filter(a => !deletedIds.includes(a.id)));
      } else {
        setApps(loadedApps);
      }

      // 2. Load Feedback
      const feedbackSnapshot = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const loadedFeedback: any[] = [];
      feedbackSnapshot.forEach((doc) => {
        loadedFeedback.push({ id: doc.id, ...doc.data() });
      });
      setFeedback(loadedFeedback);

      // 3. Load Subscribers
      const subSnapshot = await getDocs(collection(db, 'subscribers'));
      const loadedSubs: any[] = [];
      subSnapshot.forEach((doc) => {
        loadedSubs.push({ id: doc.id, ...doc.data() });
      });
      setSubscribers(loadedSubs);

      // 4. Load Categories dynamically from Firestore + Storage + Apps
      const activeAppCats = (loadedApps.length > 0 ? loadedApps : staticApps).map(a => a.category);
      const allLoadedCats = await loadAllCategories(activeAppCats);
      setCategories(allLoadedCats);

    } catch (err: any) {
      console.error('Error loading Admin Panel data:', err);
      setMessage({ text: 'Gagal memuat beberapa data dari Firestore: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync static apps to Firestore (Database Seeder)
  const handleSeedDatabasePrompt = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sinkronisasi Database Firestore',
      message: 'Apakah Anda yakin ingin memindahkan seluruh data aplikasi bawaan ke Cloud Firestore database?',
      confirmLabel: 'Ya, Sinkron Firestore',
      cancelLabel: 'Batal',
      variant: 'info',
      onConfirm: async () => {
        setActionLoading(true);
        setMessage(null);
        try {
          for (const app of staticApps) {
            const docRef = doc(db, 'applications', app.id);
            const dataToSave = {
              ...app,
              status: 'published',
              officialDownloadUrl: app.officialDownloadUrl || app.downloadUrl,
              permissions: app.permissions || ['INTERNET', 'CAMERA', 'POST_NOTIFICATIONS'],
              minSdk: app.minSdk || 21,
              targetSdk: app.targetSdk || 34,
              signingCertificate: app.signingCertificate || {
                sha256: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA',
                sha1: '11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22',
                issuer: 'C=US, O=Google Play, CN=Android Release',
                subject: 'C=US, O=Google Play, CN=Android Release'
              }
            };
            await setDoc(docRef, dataToSave);
          }
          setMessage({ text: 'Berhasil melakukan sinkronisasi database aplikasi statis ke Cloud Firestore!', type: 'success' });
          await loadAllData();
        } catch (err: any) {
          console.error('Seeding error:', err);
          setMessage({ text: 'Gagal seeding database: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Delete an Application
  const promptDeleteApp = (app: AppData) => {
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Aplikasi: ${app.name}`,
      message: `Apakah Anda yakin ingin menghapus aplikasi "${app.name}" secara permanen dari database AeroAPK?`,
      detail: `ID: ${app.id} | Kategori: ${app.category} | Versi: ${app.version}`,
      confirmLabel: 'Ya, Hapus Aplikasi',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          try {
            await deleteDoc(doc(db, 'applications', app.id));
          } catch (fireErr) {
            console.warn('Firestore delete doc notice:', fireErr);
          }
          addDeletedAppId(app.id);
          setApps(prev => prev.filter(a => a.id !== app.id));
          setSelectedAppIds(prev => prev.filter(id => id !== app.id));
          setMessage({ text: `Aplikasi "${app.name}" berhasil dihapus dari database.`, type: 'success' });
        } catch (err: any) {
          console.error('Delete error:', err);
          setMessage({ text: 'Gagal menghapus aplikasi: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Open Edit App Form
  const startEditApp = (app: AppData) => {
    setEditingApp({ ...app });
    setIsNewApp(false);
    setTempPermissions(app.permissions ? app.permissions.join(', ') : '');
    setTempScreenshots(app.screenshots ? app.screenshots.join('\n') : '');
    setAnalysisError('');
  };

  // Open Create App Form
  const startCreateApp = () => {
    const newId = 'app-' + Math.random().toString(36).substr(2, 9);
    setEditingApp({
      id: newId,
      name: '',
      slug: '',
      developer: '',
      icon: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=128&h=128&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=800&fit=crop&q=80'
      ],
      description: '',
      category: categories[0] || 'Communication',
      version: '1.0.0',
      size: '15 MB',
      androidVersion: 'Android 6.0+',
      rating: 4.5,
      downloads: 10000,
      releaseDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      downloadUrl: '',
      officialDownloadUrl: '',
      alternativeDownloadUrl: '',
      featured: false,
      popular: false,
      status: 'published',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      minSdk: 21,
      targetSdk: 35,
      signingCertificate: {
        sha256: '',
        sha1: '',
        issuer: '',
        subject: ''
      }
    });
    setIsNewApp(true);
    setTempPermissions('INTERNET, ACCESS_NETWORK_STATE');
    setTempScreenshots('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop&q=80\nhttps://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=800&fit=crop&q=80');
    setAnalysisError('');
  };

  // Server-side Static APK Analyzer Invocation
  const handleApkFileAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingApk(true);
    setAnalysisError('');

    const formData = new FormData();
    formData.append('apk', file);

    try {
      const response = await fetch('/api/analyze-apk', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server-side static analysis failed.');
      }

      const results = await response.json();
      
      // Update form state with successfully parsed values!
      if (editingApp) {
        setEditingApp(prev => {
          if (!prev) return null;
          return {
            ...prev,
            permissions: results.permissions,
            minSdk: results.minSdk,
            targetSdk: results.targetSdk,
            signingCertificate: results.signingCertificate
          };
        });
        setTempPermissions(results.permissions.join(', '));
      }
      setMessage({ text: `Analisis APK ${file.name} selesai! Field keamanan otomatis terisi.`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Gagal menganalisis APK. Silakan periksa koneksi server.');
    } finally {
      setAnalyzingApk(false);
    }
  };

  // Save/Update Application Form
  const handleSaveAppForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setActionLoading(true);
    setMessage(null);

    // Prepare arrays
    const finalPermissions = tempPermissions
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(p => p.length > 0);

    const finalScreenshots = tempScreenshots
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const appToSave: AppData = {
      ...editingApp,
      slug: editingApp.slug.trim().toLowerCase() || editingApp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      permissions: finalPermissions,
      screenshots: finalScreenshots,
      downloads: Number(editingApp.downloads) || 0,
      rating: Number(editingApp.rating) || 0,
      minSdk: editingApp.minSdk ? Number(editingApp.minSdk) : null,
      targetSdk: editingApp.targetSdk ? Number(editingApp.targetSdk) : null,
      officialDownloadUrl: editingApp.officialDownloadUrl || editingApp.downloadUrl
    };

    try {
      const docRef = doc(db, 'applications', appToSave.id);
      await setDoc(docRef, appToSave);
      
      setMessage({ text: `Aplikasi "${appToSave.name}" berhasil disimpan di database.`, type: 'success' });
      setEditingApp(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Save App error:', err);
      setMessage({ text: 'Gagal menyimpan aplikasi: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish / Schedule / Draft Actions
  const handlePublishNow = async (app: AppData) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'applications', app.id);
      await updateDoc(docRef, {
        status: 'published',
        publishMode: 'immediate',
        publishAt: null,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setMessage({ text: `Aplikasi "${app.name}" sekarang telah TERBIT publik.`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Publish now error:', err);
      setMessage({ text: 'Gagal menerbitkan aplikasi: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSchedule = async (app: AppData) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, 'applications', app.id);
      await updateDoc(docRef, {
        status: 'draft',
        publishMode: 'immediate',
        publishAt: null
      });
      setMessage({ text: `Jadwal rilis "${app.name}" dibatalkan dan diubah menjadi Draf.`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Cancel schedule error:', err);
      setMessage({ text: 'Gagal membatalkan jadwal: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatusChange = (newStatus: AppStatus) => {
    if (selectedAppIds.length === 0) return;
    const actionLabel = newStatus === 'published' ? 'menerbitkan' : newStatus === 'draft' ? 'menjadikan draf' : 'mengarsipkan';
    
    setConfirmDialog({
      isOpen: true,
      title: `Ubah Status Massal (${selectedAppIds.length} Aplikasi)`,
      message: `Apakah Anda yakin ingin ${actionLabel} ${selectedAppIds.length} aplikasi terpilih ke status "${newStatus}"?`,
      detail: `ID terpilih: ${selectedAppIds.slice(0, 5).join(', ')}${selectedAppIds.length > 5 ? '...' : ''}`,
      confirmLabel: `Ubah ke ${newStatus.toUpperCase()}`,
      cancelLabel: 'Batal',
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const chunkSize = 200;
          for (let i = 0; i < selectedAppIds.length; i += chunkSize) {
            const chunk = selectedAppIds.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(id => {
              const docRef = doc(db, 'applications', id);
              batch.update(docRef, { 
                status: newStatus,
                ...(newStatus === 'published' ? { publishMode: 'immediate', publishAt: null } : {})
              });
            });
            await batch.commit();
          }

          setMessage({ text: `Berhasil memperbarui status ${selectedAppIds.length} aplikasi menjadi "${newStatus}".`, type: 'success' });
          setSelectedAppIds([]);
          await loadAllData();
        } catch (err: any) {
          console.error('Bulk status change error:', err);
          setMessage({ text: 'Gagal melakukan pembaruan massal: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedAppIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Massal (${selectedAppIds.length} Aplikasi)`,
      message: `PERINGATAN: Anda akan menghapus permanen ${selectedAppIds.length} aplikasi terpilih dari database AeroAPK. Tindakan ini tidak dapat dibatalkan.`,
      detail: `Total item: ${selectedAppIds.length} berkas aplikasi.`,
      confirmLabel: `Ya, Hapus ${selectedAppIds.length} Aplikasi`,
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const chunkSize = 200;
          for (let i = 0; i < selectedAppIds.length; i += chunkSize) {
            const chunk = selectedAppIds.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(id => {
              const docRef = doc(db, 'applications', id);
              batch.delete(docRef);
            });
            try {
              await batch.commit();
            } catch (batchErr) {
              console.warn('Batch delete doc notice:', batchErr);
            }
          }

          addDeletedAppIds(selectedAppIds);
          setApps(prev => prev.filter(a => !selectedAppIds.includes(a.id)));
          setMessage({ text: `Berhasil menghapus permanen ${selectedAppIds.length} aplikasi terpilih.`, type: 'success' });
          setSelectedAppIds([]);
        } catch (err: any) {
          console.error('Bulk delete error:', err);
          setMessage({ text: 'Gagal menghapus aplikasi terpilih: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  const handleToggleSelectAll = (visibleAppIds: string[]) => {
    const allSelected = visibleAppIds.every(id => selectedAppIds.includes(id));
    if (allSelected) {
      setSelectedAppIds(prev => prev.filter(id => !visibleAppIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...visibleAppIds])));
    }
  };

  const handleToggleSelectApp = (appId: string) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Update Feedback Status
  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: 'reviewed' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), { status: newStatus });
      setMessage({ text: 'Status laporan berhasil diperbarui.', type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error('Update feedback error:', err);
      setMessage({ text: 'Gagal memperbarui status: ' + err.message, type: 'error' });
    }
  };

  // Delete Feedback Prompt
  const promptDeleteFeedback = (feedbackId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Laporan Feedback',
      message: 'Apakah Anda yakin ingin menghapus permanen laporan feedback ini?',
      confirmLabel: 'Hapus Feedback',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'feedback', feedbackId));
          setFeedback(prev => prev.filter(f => f.id !== feedbackId));
          setMessage({ text: 'Laporan feedback berhasil dihapus.', type: 'success' });
        } catch (err: any) {
          console.error('Delete feedback error:', err);
          setMessage({ text: 'Gagal menghapus feedback: ' + err.message, type: 'error' });
        } finally {
          closeConfirmDialog();
        }
      }
    });
  };

  // Delete Subscriber Prompt
  const promptDeleteSubscriber = (subId: string, email: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Langganan Newsletter',
      message: `Apakah Anda yakin ingin menghapus email "${email}" dari daftar langganan update AeroAPK?`,
      confirmLabel: 'Hapus Subscriber',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'subscribers', subId));
          setSubscribers(prev => prev.filter(s => s.id !== subId));
          setMessage({ text: 'Subscriber berhasil dihapus.', type: 'success' });
        } catch (err: any) {
          console.error('Delete subscriber error:', err);
          setMessage({ text: 'Gagal menghapus subscriber: ' + err.message, type: 'error' });
        } finally {
          closeConfirmDialog();
        }
      }
    });
  };

  // Category Management: Add
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setMessage({ text: 'Silakan masukkan nama kategori yang valid (minimal 2 karakter).', type: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await addCategoryToDb(trimmed, newCatDesc.trim());
      if (!res.success) {
        setMessage({ text: res.error || 'Gagal menambahkan kategori.', type: 'error' });
      } else {
        setCategories(res.updatedList);
        setNewCatName('');
        setNewCatDesc('');
        setMessage({ text: `Kategori "${trimmed}" berhasil ditambahkan dan disimpan ke database!`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
      setMessage({ text: 'Gagal menambahkan kategori: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Category Management: Delete Prompt
  const promptDeleteCategory = (catName: string) => {
    const appsUsingCategory = apps.filter(a => a.category?.toLowerCase() === catName.toLowerCase());
    const count = appsUsingCategory.length;

    setConfirmDialog({
      isOpen: true,
      title: `Hapus Kategori: ${catName}`,
      message: count > 0 
        ? `Terdapat ${count} aplikasi yang saat ini menggunakan kategori "${catName}". Jika dihapus, aplikasi tersebut akan otomatis dialihkan ke kategori "Utilities". Apakah Anda yakin ingin melanjutkan?`
        : `Apakah Anda yakin ingin menghapus kategori "${catName}" secara permanen dari database?`,
      detail: count > 0 ? `Aplikasi terkait: ${appsUsingCategory.slice(0, 3).map(a => a.name).join(', ')}${count > 3 ? ` dan ${count - 3} lainnya` : ''}` : undefined,
      confirmLabel: 'Ya, Hapus Kategori',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await deleteCategoryFromDb(catName, 'Utilities');
          if (res.success) {
            setCategories(res.updatedList);
            setMessage({ text: `Kategori "${catName}" berhasil dihapus dari database.`, type: 'success' });
            await loadAllData();
          } else {
            setMessage({ text: res.error || 'Gagal menghapus kategori.', type: 'error' });
          }
        } catch (err: any) {
          console.error('Delete category error:', err);
          setMessage({ text: 'Gagal menghapus kategori: ' + err.message, type: 'error' });
        } finally {
          setActionLoading(false);
          closeConfirmDialog();
        }
      }
    });
  };

  // Category Management: Save Rename
  const handleSaveRenameCategory = async () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    setActionLoading(true);
    try {
      const res = await renameCategoryInDb(editingCategory.oldName, editingCategory.newName.trim());
      if (res.success) {
        setCategories(res.updatedList);
        setMessage({ text: `Kategori berhasil diubah menjadi "${editingCategory.newName.trim()}".`, type: 'success' });
        setEditingCategory(null);
        await loadAllData();
      } else {
        setMessage({ text: res.error || 'Gagal mengubah nama kategori.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Rename category error:', err);
      setMessage({ text: 'Gagal mengubah nama kategori: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculations
  const totalDownloads = apps.reduce((acc, app) => acc + (Number(app.downloads) || 0), 0);
  const newFeedbackCount = feedback.filter(f => f.status === 'new').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 lg:p-4">
      {/* Admin Panel Header Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <span className="px-2.5 py-1 text-[9.5px] font-black bg-red-500/20 text-red-400 border border-red-500/35 rounded-full tracking-widest uppercase select-none">
              Control Panel & Analisis
            </span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-none">
              AeroAPK Administrative System
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Operator Logged In: <strong className="text-white">{user?.email}</strong>
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSeedDatabasePrompt}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/25 border border-blue-500/35 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer select-none"
            >
              <Database className="h-4 w-4" />
              <span>Sinkron Firestore</span>
            </button>
            <button
              onClick={() => onNavigate('all')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer select-none"
            >
              <Eye className="h-4 w-4" />
              <span>Lihat Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Message Feedback */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-bold shadow-md animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-extrabold uppercase hover:underline opacity-80 cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Main Form Overlay Editor Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-[#151921] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden my-8 animate-fade-in">
            {/* Form Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {isNewApp ? 'Tambah Aplikasi Baru' : `Edit Aplikasi: ${editingApp.name}`}
                </h2>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                  Lengkapi spesifikasi teknis rilis APK, branding visual, dan audit tanda tangan digital.
                </p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
              >
                Tutup Form
              </button>
            </div>

            {/* Form Body Scrollable */}
            <form onSubmit={handleSaveAppForm} className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
              
              {/* SERVER-SIDE APK STATIC ANALYSIS ACTION BOX */}
              <div className="p-5 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-600/[0.03] dark:to-indigo-600/[0.03] border border-blue-500/10 dark:border-blue-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Server-side Static APK Analyzer
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 font-bold mt-0.5 leading-normal">
                      Unggah file APK asli di sini. Sistem backend AeroAPK akan membedah ZIP struktur, mengekstrak binary Manifest, mengumpulkan permission, dan membaca sidik jari sertifikat rilis secara real-time.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md select-none">
                    <Upload className="h-4 w-4" />
                    <span>{analyzingApk ? 'Menganalisis file APK...' : 'Pilih File APK & Analisis'}</span>
                    <input 
                      type="file" 
                      accept=".apk"
                      onChange={handleApkFileAnalyze}
                      disabled={analyzingApk}
                      className="hidden"
                    />
                  </label>

                  {analyzingApk && (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500 animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sedang membongkar berkas APK di backend server...</span>
                    </div>
                  )}

                  {analysisError && (
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {analysisError}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Grid Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Basic Information */}
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Informasi Dasar
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Aplikasi</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.name}
                      onChange={e => setEditingApp({ ...editingApp, name: e.target.value })}
                      placeholder="Contoh: WhatsApp Messenger"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Slug / Package ID</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.slug}
                      onChange={e => setEditingApp({ ...editingApp, slug: e.target.value })}
                      placeholder="whatsapp (ID unik untuk routing)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Developer</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.developer}
                      onChange={e => setEditingApp({ ...editingApp, developer: e.target.value })}
                      placeholder="Contoh: WhatsApp LLC"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kategori Aplikasi</label>
                    <select
                      value={editingApp.category}
                      onChange={e => setEditingApp({ ...editingApp, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
                    >
                      {categories.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Brand Identity Assets */}
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Visual Branding & Media
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">URL Ikon Aplikasi</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.icon}
                      onChange={e => setEditingApp({ ...editingApp, icon: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">URL Screenshots (Satu baris per Gambar)</label>
                    <textarea 
                      rows={4}
                      value={tempScreenshots}
                      onChange={e => setTempScreenshots(e.target.value)}
                      placeholder="https://image1.com\nhttps://image2.com"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* 3. Specs & Metrics */}
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Rilis Metadata & Metrik
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Versi</label>
                      <input 
                        type="text" required value={editingApp.version}
                        onChange={e => setEditingApp({ ...editingApp, version: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ukuran Berkas</label>
                      <input 
                        type="text" required value={editingApp.size}
                        onChange={e => setEditingApp({ ...editingApp, size: e.target.value })}
                        placeholder="Contoh: 48.5 MB"
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Android Minimal</label>
                      <input 
                        type="text" required value={editingApp.androidVersion}
                        onChange={e => setEditingApp({ ...editingApp, androidVersion: e.target.value })}
                        placeholder="Contoh: Android 5.0+"
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Rating (0 - 5)</label>
                      <input 
                        type="number" step="0.1" max="5" value={editingApp.rating}
                        onChange={e => setEditingApp({ ...editingApp, rating: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Unduhan</label>
                      <input 
                        type="number" value={editingApp.downloads}
                        onChange={e => setEditingApp({ ...editingApp, downloads: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Terakhir Diupdate</label>
                      <input 
                        type="date" value={editingApp.updatedAt}
                        onChange={e => setEditingApp({ ...editingApp, updatedAt: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Real Download URLs - Labels EXACTLY as requested */}
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                    Tautan Unduhan Langsung (Dual Links)
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tautan Unduhan Resmi</label>
                    <input 
                      type="text" 
                      required
                      value={editingApp.officialDownloadUrl || editingApp.downloadUrl}
                      onChange={e => setEditingApp({ ...editingApp, officialDownloadUrl: e.target.value, downloadUrl: e.target.value })}
                      placeholder="https://cdn.example.com/whatsapp.apk"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tautan Unduhan Alternatif</label>
                    <input 
                      type="text" 
                      value={editingApp.alternativeDownloadUrl || ''}
                      onChange={e => setEditingApp({ ...editingApp, alternativeDownloadUrl: e.target.value })}
                      placeholder="https://mirror.example.com/whatsapp-alt.apk (Opsional)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>

              {/* 5. Detailed Description & Changelogs */}
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Publikasi Teks & Log Perubahan
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Deskripsi Lengkap Aplikasi</label>
                  <textarea 
                    rows={5}
                    required
                    value={editingApp.description}
                    onChange={e => setEditingApp({ ...editingApp, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Yang Baru di Versi Ini (Changelog)</label>
                  <textarea 
                    rows={3}
                    value={editingApp.whatsNew || ''}
                    onChange={e => setEditingApp({ ...editingApp, whatsNew: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Technical Security Information (Form Fields) */}
              <div className="space-y-5 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Technical Security Information (Audit Metadata)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target API Level (SDK Target)</label>
                    <input 
                      type="number"
                      value={editingApp.targetSdk || ''}
                      onChange={e => setEditingApp({ ...editingApp, targetSdk: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Contoh: 35"
                      className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Minimum API Level (SDK Minimum)</label>
                    <input 
                      type="number"
                      value={editingApp.minSdk || ''}
                      onChange={e => setEditingApp({ ...editingApp, minSdk: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Contoh: 21"
                      className="w-full px-3 py-2 bg-white dark:bg-black/35 border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Android Permissions (Pisahkan dengan Koma)</label>
                  <input 
                    type="text"
                    value={tempPermissions}
                    onChange={e => setTempPermissions(e.target.value)}
                    placeholder="INTERNET, CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">Fingerprint & Certificate Authority</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SHA-256 Fingerprint</label>
                    <input 
                      type="text"
                      value={editingApp.signingCertificate?.sha256 || ''}
                      onChange={e => setEditingApp({
                        ...editingApp,
                        signingCertificate: {
                          ...(editingApp.signingCertificate || { sha1: '', issuer: '', subject: '' }),
                          sha256: e.target.value.toUpperCase()
                        }
                      })}
                      placeholder="AA:BB:CC..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SHA-1 Fingerprint</label>
                    <input 
                      type="text"
                      value={editingApp.signingCertificate?.sha1 || ''}
                      onChange={e => setEditingApp({
                        ...editingApp,
                        signingCertificate: {
                          ...(editingApp.signingCertificate || { sha256: '', issuer: '', subject: '' }),
                          sha1: e.target.value.toUpperCase()
                        }
                      })}
                      placeholder="11:22:33..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certificate Issuer</label>
                      <input 
                        type="text"
                        value={editingApp.signingCertificate?.issuer || ''}
                        onChange={e => setEditingApp({
                          ...editingApp,
                          signingCertificate: {
                            ...(editingApp.signingCertificate || { sha256: '', sha1: '', subject: '' }),
                            issuer: e.target.value
                          }
                        })}
                        placeholder="C=US, O=Google Play, CN=Android Release"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certificate Subject</label>
                      <input 
                        type="text"
                        value={editingApp.signingCertificate?.subject || ''}
                        onChange={e => setEditingApp({
                          ...editingApp,
                          signingCertificate: {
                            ...(editingApp.signingCertificate || { sha256: '', sha1: '', issuer: '' }),
                            subject: e.target.value
                          }
                        })}
                        placeholder="C=US, O=WhatsApp LLC, CN=WhatsApp"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Visibility, Discovery, Scheduled Publishing & Dynamic Badges */}
              <div className="space-y-5 p-5 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-150 dark:border-white/5">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-2">
                  Visibilitas, Jadwal Publikasi & Badges
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status Publikasi</label>
                    <select
                      value={editingApp.status || 'published'}
                      onChange={e => setEditingApp({ 
                        ...editingApp, 
                        status: e.target.value as any,
                        publishMode: e.target.value === 'scheduled' ? 'scheduled' : editingApp.publishMode || 'immediate'
                      })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-850 dark:text-white cursor-pointer"
                    >
                      <option value="published">Published (Tampil Publik di Katalog)</option>
                      <option value="draft">Draft (Draf - Hanya Admin yang dapat Pratinjau)</option>
                      <option value="scheduled">Scheduled (Terjadwal Otomatis)</option>
                      <option value="archived">Archived (Diarsipkan / Disembunyikan)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mode Penerbitan</label>
                    <select
                      value={editingApp.publishMode || (editingApp.status === 'scheduled' ? 'scheduled' : 'immediate')}
                      onChange={e => setEditingApp({ 
                        ...editingApp, 
                        publishMode: e.target.value as any,
                        status: e.target.value === 'scheduled' ? 'scheduled' : (editingApp.status === 'scheduled' ? 'published' : editingApp.status)
                      })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-850 dark:text-white cursor-pointer"
                    >
                      <option value="immediate">Immediate (Langsung Aktif)</option>
                      <option value="scheduled">Scheduled (Terjadwal pada Waktu Tertentu)</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Datetime picker when publishMode === 'scheduled' */}
                {(editingApp.publishMode === 'scheduled' || editingApp.status === 'scheduled') && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <label className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Jadwal Tanggal & Jam Penerbitan (WIB / Asia/Jakarta)
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="datetime-local"
                        value={editingApp.publishAt || ''}
                        onChange={e => setEditingApp({ ...editingApp, publishAt: e.target.value, status: 'scheduled' })}
                        className="px-3.5 py-2 bg-white dark:bg-black/40 border border-blue-500/30 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center font-medium">
                        Aplikasi akan disembunyikan sampai waktu jadwal tercapai.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 items-center pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editingApp.featured}
                      onChange={e => setEditingApp({ ...editingApp, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-500 border-slate-300 dark:border-white/10 rounded"
                    />
                    <span>Tampilkan sebagai Aplikasi Featured</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editingApp.popular}
                      onChange={e => setEditingApp({ ...editingApp, popular: e.target.checked })}
                      className="w-4 h-4 text-blue-500 border-slate-300 dark:border-white/10 rounded"
                    />
                    <span>Tampilkan sebagai Aplikasi Populer</span>
                  </label>
                </div>

                {/* Dynamic Badges Live Inspector */}
                <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Pratinjau Badges Dinamis yang Memenuhi Syarat:
                    </span>
                  </div>
                  
                  {(() => {
                    const dynamicBadges = calculateAppBadges(editingApp);
                    if (dynamicBadges.length === 0) {
                      return (
                        <p className="text-[11px] text-slate-400 italic">
                          Aplikasi saat ini tidak memenuhi aturan trigger badge khusus (standar catalog).
                        </p>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {dynamicBadges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border shadow-xs ${badge.styleClasses}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-150 dark:border-white/5 pt-6">
                <div>
                  {editingApp.slug && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('detail', editingApp.slug);
                        setEditingApp(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-amber-500/20"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Pratinjau Draf Tampilan</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setEditingApp({ ...editingApp, status: 'draft', publishMode: 'immediate' });
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 50);
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <span>Simpan Draf</span>
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    <Save className="h-4 w-4" />
                    <span>{actionLoading ? 'Menyimpan...' : (editingApp.status === 'scheduled' ? 'Jadwalkan Aplikasi' : 'Simpan & Publikasikan')}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Main Content Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Nav Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard Metrics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('applications')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4" />
              <span>Kelola Aplikasi</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-black bg-white/20 dark:bg-white/10 rounded-full">
              {apps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <FileJson className="h-4 w-4 text-amber-500" />
            <span>Bulk Import JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('import-history')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'import-history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <History className="h-4 w-4 text-purple-500" />
            <span>Riwayat Import JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'trending'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Dashboard Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4" />
              <span>Feedback Laporan</span>
            </div>
            {newFeedbackCount > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-black bg-red-500 text-white rounded-full">
                {newFeedbackCount} baru
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('newsletter')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'newsletter'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4" />
              <span>Newsletter Subscribers</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-black bg-white/20 dark:bg-white/10 rounded-full">
              {subscribers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>Kelola Kategori ({categories.length})</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="lg:col-span-9 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          
          {/* BULK EDIT MODAL */}
          {showBulkEditModal && (
            <BulkEditModal
              selectedAppIds={selectedAppIds}
              apps={apps}
              categories={categories}
              onClose={() => setShowBulkEditModal(false)}
              onSuccess={async () => {
                setShowBulkEditModal(false);
                setSelectedAppIds([]);
                setMessage({ text: 'Perubahan massal berhasil diterapkan ke database!', type: 'success' });
                await loadAllData();
              }}
            />
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3 animate-pulse">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Menghubungkan ke Cloud Firestore...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Overview Dashboard</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Tinjauan statistik rilis aplikasi, umpan balik kerusakan, dan langganan.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 select-none">
                    <div className="p-4 bg-slate-50 dark:bg-black/35 rounded-2xl border border-slate-150 dark:border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Rilis</span>
                      <p className="text-2xl font-black text-slate-850 dark:text-white">{apps.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-black/35 rounded-2xl border border-slate-150 dark:border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Akumulasi Unduhan</span>
                      <p className="text-2xl font-black text-slate-850 dark:text-white">{(totalDownloads / 1000000000).toFixed(1)} Miliar+</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-black/35 rounded-2xl border border-slate-150 dark:border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Laporan Masuk</span>
                      <p className="text-2xl font-black text-slate-850 dark:text-white">{feedback.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-black/35 rounded-2xl border border-slate-150 dark:border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email Terdaftar</span>
                      <p className="text-2xl font-black text-slate-850 dark:text-white">{subscribers.length}</p>
                    </div>
                  </div>

                  {/* Quick summary status lists */}
                  <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">Tips Administrator:</p>
                      <p>Gunakan tab <strong>Bulk Import JSON</strong> untuk mengimpor aplikasi baru secara massal, atau tab <strong>Dashboard Trending</strong> untuk memantau performa keterlibatan pengunjung.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATIONS LIST WITH BULK OPERATIONS */}
              {activeTab === 'applications' && (() => {
                // Filter apps based on status, category, search
                const filteredApps = apps.filter(app => {
                  const matchesStatus = appStatusFilter === 'all' || (app.status || 'published') === appStatusFilter;
                  const matchesCategory = appCategoryFilter === 'all' || app.category === appCategoryFilter;
                  const matchesSearch = !appSearchQuery.trim() || 
                    app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                    app.developer.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                    (app.slug && app.slug.toLowerCase().includes(appSearchQuery.toLowerCase()));
                  return matchesStatus && matchesCategory && matchesSearch;
                });

                const publishedCount = apps.filter(a => (a.status || 'published') === 'published').length;
                const draftCount = apps.filter(a => a.status === 'draft').length;
                const scheduledCount = apps.filter(a => a.status === 'scheduled').length;
                const archivedCount = apps.filter(a => a.status === 'archived').length;

                const visibleIds = filteredApps.map(a => a.id);
                const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAppIds.includes(id));

                return (
                  <div className="space-y-6 animate-fade-in">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          Daftar Aplikasi Rilis & Manajemen
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
                          Mengelola, edit massal, jadwal rilis, audit sertifikat, dan pratinjau draf.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('import')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          <FileJson className="h-4 w-4" />
                          <span>Bulk Import JSON</span>
                        </button>
                        <button
                          onClick={startCreateApp}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Tambah Aplikasi</span>
                        </button>
                      </div>
                    </div>

                    {/* Status Tabs & Filters */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 border-b border-slate-150 dark:border-white/5 pb-3">
                        <button
                          onClick={() => setAppStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appStatusFilter === 'all'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Semua ({apps.length})
                        </button>
                        <button
                          onClick={() => setAppStatusFilter('published')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appStatusFilter === 'published'
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Published ({publishedCount})
                        </button>
                        <button
                          onClick={() => setAppStatusFilter('draft')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appStatusFilter === 'draft'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Draft ({draftCount})
                        </button>
                        <button
                          onClick={() => setAppStatusFilter('scheduled')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appStatusFilter === 'scheduled'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Scheduled ({scheduledCount})
                        </button>
                        <button
                          onClick={() => setAppStatusFilter('archived')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appStatusFilter === 'archived'
                              ? 'bg-slate-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Archived ({archivedCount})
                        </button>
                      </div>

                      {/* Search & Category Filter */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={appSearchQuery}
                            onChange={e => setAppSearchQuery(e.target.value)}
                            placeholder="Cari berdasarkan nama, developer, atau slug..."
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                          />
                        </div>
                        <select
                          value={appCategoryFilter}
                          onChange={e => setAppCategoryFilter(e.target.value)}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                        >
                          <option value="all">Semua Kategori</option>
                          {categories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Floating Bulk Operations Toolbar */}
                    {selectedAppIds.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fade-in border border-blue-500/30">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-blue-300" />
                          <span className="text-xs font-black">
                            {selectedAppIds.length} Aplikasi Dipilih
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setShowBulkEditModal(true)}
                            className="px-3 py-1.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-black cursor-pointer transition-colors"
                          >
                            Bulk Edit
                          </button>
                          <button
                            onClick={() => handleBulkStatusChange('published')}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Terbitkan
                          </button>
                          <button
                            onClick={() => handleBulkStatusChange('draft')}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Jadikan Draf
                          </button>
                          <button
                            onClick={() => handleBulkStatusChange('archived')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Arsipkan
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Hapus Massal
                          </button>
                          <button
                            onClick={() => setSelectedAppIds([])}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Table lists */}
                    <div className="overflow-x-auto border border-slate-150 dark:border-white/5 rounded-2xl">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
                        <thead className="bg-slate-50 dark:bg-white/[0.02]">
                          <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={isAllVisibleSelected}
                                onChange={() => handleToggleSelectAll(visibleIds)}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                title="Pilih Semua yang Ditampilkan"
                              />
                            </th>
                            <th className="py-3 px-3">Aplikasi</th>
                            <th className="py-3 px-3">Developer & Kategori</th>
                            <th className="py-3 px-3">Versi & Status</th>
                            <th className="py-3 px-3">Audit Keamanan</th>
                            <th className="py-3 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                          {filteredApps.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-450 font-bold">
                                Tidak ada aplikasi yang cocok dengan filter yang dipilih.
                              </td>
                            </tr>
                          ) : (
                            filteredApps.map((app) => {
                              const isSelected = selectedAppIds.includes(app.id);
                              const status = app.status || 'published';
                              const appBadges = calculateAppBadges(app);

                              return (
                                <tr
                                  key={app.id}
                                  className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors ${
                                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectApp(app.id)}
                                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 flex items-center gap-3">
                                    <img
                                      src={app.icon}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="w-9 h-9 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shadow-xs"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-black text-slate-900 dark:text-white truncate">
                                        {app.name}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                        <span className="text-[9.5px] font-mono text-slate-400">
                                          slug: {app.slug || app.id}
                                        </span>
                                        {appBadges.slice(0, 2).map((b, bi) => (
                                          <span
                                            key={bi}
                                            className={`text-[8.5px] font-black px-1.5 py-0.2 rounded ${b.styleClasses}`}
                                          >
                                            {b.label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <p className="text-slate-800 dark:text-slate-200">{app.developer}</p>
                                    <span className="text-[9.5px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded font-black">
                                      {app.category}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                        v{app.version}
                                      </span>
                                      {status === 'published' && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-md">
                                          <Check className="h-2.5 w-2.5" /> Published
                                        </span>
                                      )}
                                      {status === 'draft' && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md">
                                          Draft
                                        </span>
                                      )}
                                      {status === 'scheduled' && (
                                        <div className="space-y-0.5">
                                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-md">
                                            <Calendar className="h-2.5 w-2.5" /> Terjadwal
                                          </span>
                                          {app.publishAt && (
                                            <span className="block text-[9.5px] font-mono text-slate-400">
                                              {new Date(app.publishAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {status === 'archived' && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-md">
                                          Archived
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    {app.signingCertificate?.sha256 ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500">
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Verified</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-bold">Standard</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Quick Publish for Draft / Scheduled */}
                                      {(status === 'draft' || status === 'scheduled') && (
                                        <button
                                          onClick={() => handlePublishNow(app)}
                                          className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                                          title="Terbitkan Sekarang"
                                        >
                                          Terbitkan
                                        </button>
                                      )}

                                      {/* Cancel schedule */}
                                      {status === 'scheduled' && (
                                        <button
                                          onClick={() => handleCancelSchedule(app)}
                                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                                          title="Batalkan Jadwal"
                                        >
                                          Batal Jadwal
                                        </button>
                                      )}

                                      {/* Preview button */}
                                      <button
                                        onClick={() => onNavigate('detail', app.slug || app.id)}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors inline-flex"
                                        title="Pratinjau Halaman"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </button>

                                      {/* Edit button */}
                                      <button
                                        onClick={() => startEditApp(app)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer inline-flex transition-colors"
                                        title="Edit Aplikasi"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>

                                      {/* Delete button */}
                                      <button
                                        onClick={() => promptDeleteApp(app)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer inline-flex transition-colors"
                                        title="Hapus Aplikasi"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: BULK IMPORT JSON */}
              {activeTab === 'import' && (
                <BulkImportView
                  user={user}
                  categories={categories}
                  existingApps={apps}
                  onImportComplete={async () => {
                    setActiveTab('applications');
                    await loadAllData();
                  }}
                  onCancel={() => setActiveTab('applications')}
                />
              )}

              {/* TAB: IMPORT HISTORY */}
              {activeTab === 'import-history' && (
                <ImportHistoryView />
              )}

              {/* TAB: TRENDING DASHBOARD */}
              {activeTab === 'trending' && (
                <TrendingDashboard
                  apps={apps}
                  onRefresh={loadAllData}
                />
              )}

              {/* TAB 3: FEEDBACK MANAGEMENT */}
              {activeTab === 'feedback' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Umpan Balik Kerusakan & Kendala</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Tinjau keluhan pengunjung, tautan download mati, atau request update versi baru.</p>
                  </div>

                  {/* Filters for feedback status/type */}
                  <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-black/35 rounded-2xl border border-slate-150 dark:border-white/5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filter Status</span>
                      <select 
                        value={feedbackFilterStatus}
                        onChange={e => setFeedbackFilterStatus(e.target.value)}
                        className="block w-full px-2.5 py-1.5 bg-white dark:bg-black border rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <option value="all">Semua Status</option>
                        <option value="new">Baru (New)</option>
                        <option value="reviewed">Ditinjau (Reviewed)</option>
                        <option value="resolved">Selesai (Resolved)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filter Jenis Kendala</span>
                      <select 
                        value={feedbackFilterType}
                        onChange={e => setFeedbackFilterType(e.target.value)}
                        className="block w-full px-2.5 py-1.5 bg-white dark:bg-black border rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <option value="all">Semua Masalah</option>
                        <option value="Tautan Unduhan Resmi rusak">Tautan Resmi rusak</option>
                        <option value="Tautan Unduhan Alternatif rusak">Tautan Alternatif rusak</option>
                        <option value="Versi aplikasi sudah outdated">Outdated version</option>
                        <option value="Informasi aplikasi tidak sesuai">Info tidak sesuai</option>
                        <option value="Screenshot tidak sesuai">Screenshots salah</option>
                        <option value="Masalah lainnya">Masalah lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* Feedback Card/Tables List */}
                  {feedback.length === 0 ? (
                    <div className="p-8 text-center text-slate-450 font-bold border border-dashed rounded-2xl">
                      Tidak ada laporan feedback masuk.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedback
                        .filter(f => feedbackFilterStatus === 'all' || f.status === feedbackFilterStatus)
                        .filter(f => feedbackFilterType === 'all' || f.type === feedbackFilterType)
                        .map((f) => (
                          <div 
                            key={f.id} 
                            className="p-5 bg-slate-50 dark:bg-[#13161C] border border-slate-150 dark:border-white/5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden"
                          >
                            {/* Accent indicator for status */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${
                              f.status === 'new' ? 'bg-red-500' : f.status === 'reviewed' ? 'bg-amber-500' : 'bg-green-500'
                            }`} />

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  f.status === 'new' 
                                    ? 'bg-red-500/10 border-red-500/25 text-red-500' 
                                    : f.status === 'reviewed'
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                                      : 'bg-green-500/10 border-green-500/25 text-green-500'
                                }`}>
                                  {f.status === 'new' ? 'baru' : f.status === 'reviewed' ? 'ditinjau' : 'selesai'}
                                </span>
                                <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight mt-2 flex items-center gap-1.5">
                                  <span>{f.type}</span>
                                  <span className="text-[10px] text-blue-500 font-extrabold bg-blue-500/10 px-2 py-0.5 rounded-md">
                                    {f.applicationName}
                                  </span>
                                </h3>
                              </div>

                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                                {f.createdAt?.seconds 
                                  ? new Date(f.createdAt.seconds * 1000).toLocaleString('id-ID')
                                  : new Date().toLocaleString('id-ID')}
                              </span>
                            </div>

                            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold bg-white dark:bg-black/25 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                              {f.message}
                            </p>

                            <div className="flex flex-wrap justify-between items-center gap-3 pt-1 text-xs">
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold">
                                Pengirim: <strong className="text-slate-700 dark:text-slate-300">{f.email || 'Anonim'}</strong>
                              </span>

                              <div className="flex items-center gap-2">
                                {f.status !== 'reviewed' && f.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleUpdateFeedbackStatus(f.id, 'reviewed')}
                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg cursor-pointer"
                                  >
                                    Tandai Ditinjau
                                  </button>
                                )}
                                {f.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleUpdateFeedbackStatus(f.id, 'resolved')}
                                    className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px] font-bold rounded-lg cursor-pointer"
                                  >
                                    Selesaikan
                                  </button>
                                )}
                                <button
                                  onClick={() => promptDeleteFeedback(f.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer inline-flex"
                                  title="Hapus Feedback"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: NEWSLETTER LIST */}
              {activeTab === 'newsletter' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Newsletter Subscribers</h2>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Mengelola email pelanggan yang terdaftar untuk sistem update AeroAPK.</p>
                  </div>

                  {subscribers.length === 0 ? (
                    <div className="p-8 text-center text-slate-450 font-bold border border-dashed rounded-2xl">
                      Belum ada email yang terdaftar ke newsletter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                        <thead>
                          <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pl-2">Alamat Email</th>
                            <th className="pb-3">Tanggal Bergabung</th>
                            <th className="pb-3 pr-2 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {subscribers.map((sub) => (
                            <tr key={sub.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01]">
                              <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-200">{sub.email}</td>
                              <td className="py-3 text-slate-450 font-bold">
                                {sub.subscribedAt?.seconds 
                                  ? new Date(sub.subscribedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'N/A'}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                <button
                                  onClick={() => promptDeleteSubscriber(sub.id, sub.email)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer inline-flex"
                                  title="Hapus Subscriber"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CATEGORIES LIST */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          Manajemen Kategori Aplikasi
                        </h2>
                      </div>
                      <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                        Kelola kategori aplikasi secara langsung. Penambahan dan penghapusan tersimpan permanen di Cloud Firestore database.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black">
                        {categories.length} Kategori Terdaftar
                      </span>
                    </div>
                  </div>

                  {/* Add New Category Card */}
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-white/[0.02] dark:to-blue-950/10 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Tambah Kategori Baru
                      </h3>
                    </div>

                    <form onSubmit={handleAddCategory} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Nama Kategori <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            placeholder="Contoh: Entertainment, Finance"
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Deskripsi Kategori (Opsional)
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={newCatDesc}
                              onChange={e => setNewCatDesc(e.target.value)}
                              placeholder="Deskripsi singkat mengenai jenis aplikasi di kategori ini..."
                              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                              disabled={actionLoading}
                            />
                            <button
                              type="submit"
                              disabled={actionLoading || !newCatName.trim()}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-md shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                              <span>{actionLoading ? 'Menyimpan...' : 'Tambah Kategori'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Active Categories List */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Daftar Kategori ({categories.length})
                        </h3>
                        <p className="text-[11px] text-slate-450 font-semibold">
                          Klik nama kategori untuk melihat aplikasi terkait, atau gunakan tombol aksi untuk mengubah atau menghapus.
                        </p>
                      </div>

                      {/* Search category */}
                      <div className="w-full sm:w-64">
                        <input 
                          type="text"
                          value={categorySearchQuery}
                          onChange={e => setCategorySearchQuery(e.target.value)}
                          placeholder="Cari kategori..."
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {categories.length === 0 ? (
                      <div className="p-8 text-center text-slate-450 font-bold border border-dashed rounded-2xl">
                        Belum ada kategori yang terdaftar. Tambahkan kategori baru di formulir atas.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories
                          .filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                          .map((cat, i) => {
                            const appCount = apps.filter(a => a.category?.toLowerCase() === cat.toLowerCase()).length;
                            const isEditing = editingCategory?.oldName === cat;

                            return (
                              <div 
                                key={i}
                                className="p-4 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-3 shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between"
                              >
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-extrabold text-blue-500 uppercase">Ubah Nama Kategori</span>
                                    <input 
                                      type="text"
                                      value={editingCategory.newName}
                                      onChange={e => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/50 border border-blue-500 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                                      autoFocus
                                    />
                                    <div className="flex gap-1.5 justify-end pt-1">
                                      <button
                                        onClick={() => setEditingCategory(null)}
                                        className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={handleSaveRenameCategory}
                                        disabled={actionLoading || !editingCategory.newName.trim()}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg cursor-pointer"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <Tag className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                          <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                                            {cat}
                                          </h4>
                                        </div>
                                        <span className="inline-block text-[10px] font-mono text-slate-400">
                                          slug: {cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                                        </span>
                                      </div>

                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                        appCount > 0 
                                          ? 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400' 
                                          : 'bg-slate-500/10 border-slate-500/25 text-slate-400'
                                      }`}>
                                        {appCount} Aplikasi
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                                      <button
                                        onClick={() => {
                                          setAppCategoryFilter(cat);
                                          setActiveTab('applications');
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        title="Lihat aplikasi di kategori ini"
                                      >
                                        <span>Lihat Aplikasi</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>

                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors"
                                          title="Ubah Nama Kategori"
                                        >
                                          <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => promptDeleteCategory(cat)}
                                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                                          title="Hapus Kategori"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* In-App Confirmation Modal for Destructive & Important Actions */}
      <ConfirmDialogModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
        loading={actionLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}
