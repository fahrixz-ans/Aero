import React, { useState, useEffect, useRef } from 'react';
import { appsData, CATEGORIES } from './data/appsData';
import { AppData, FilterState, SortOption } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import AppCard from './components/AppCard';
import CategoryCard from './components/CategoryCard';
import AppDetail from './components/AppDetail';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import AdminPanel from './components/AdminPanel';
import RecentlyUpdatedPage from './components/RecentlyUpdatedPage';
import DynamicSEO from './components/DynamicSEO';
import AdSense from './components/AdSense'; // ⬅️ TAMBAHAN: Import komponen iklan
import { 
  Users, Gamepad2, Film, CheckSquare, GraduationCap, 
  Camera, Music, Video, Wrench, MessageSquare, Wallet, 
  ShieldCheck, Info, CheckCircle, Mail, AlertTriangle, Bookmark 
} from 'lucide-react';

// Firebase Authentication & Firestore imports
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedAppSlug, setSelectedAppSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [loading, setLoading] = useState<boolean>(false);

  // Dark mode initialized from localStorage (defaults to true for premium bento mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  // User state and bookmarks state from Firebase
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Dynamic applications list (Firestore reactive, fallback to static)
  const [apps, setApps] = useState<AppData[]>(appsData);

  useEffect(() => {
    const unsubscribeApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      if (!snapshot.empty) {
        const loadedApps: AppData[] = [];
        snapshot.forEach((doc) => {
          loadedApps.push({ id: doc.id, ...doc.data() } as AppData);
        });
        setApps(loadedApps);
      } else {
        setApps(appsData);
      }
    }, (err) => {
      console.error("Firestore applications subscription error:", err);
      setApps(appsData);
    });
    return () => unsubscribeApps();
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    rating: '',
    version: '',
    recentlyUpdated: false,
    size: '',
    minAndroid: '',
    updatedDateRange: ''
  });

  // Contact form submission state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // DMCA form state
  const [dmcaForm, setDmcaForm] = useState({ appName: '', url: '', email: '', description: '' });
  const [dmcaSubmitted, setDmcaSubmitted] = useState(false);

  // Synchronize Dark Mode state with HTML classes and Local Storage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Synchronize Firebase Auth state and real-time Firestore bookmarks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Record login profile to Firestore securely (User Profile Persistence)
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          lastActive: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.error("Firestore save user error:", err);
        });

        // Real-time Firestore query subscription for bookmarks
        const bookmarksRef = collection(db, 'users', currentUser.uid, 'bookmarks');
        const unsubBookmarks = onSnapshot(bookmarksRef, (snapshot) => {
          const ids = snapshot.docs.map(d => d.id);
          setBookmarks(ids);
        }, (err) => {
          console.error("Firestore read bookmarks error:", err);
        });

        return () => unsubBookmarks();
      } else {
        setBookmarks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In trigger with Popup
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google Sign-In failed:", err);
    }
  };

  // Sign-Out trigger
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-Out failed:", err);
    }
  };

  // Toggle app bookmark directly
  const handleToggleBookmark = async (appId: string) => {
    if (!user) {
      // Prompt user to sign-in first
      await handleSignIn();
      return;
    }

    const isBookmarked = bookmarks.includes(appId);
    const bookmarkDocRef = doc(db, 'users', user.uid, 'bookmarks', appId);

    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkDocRef);
      } else {
        const app = apps.find(a => a.id === appId);
        await setDoc(bookmarkDocRef, {
          appId,
          appName: app?.name || appId,
          bookmarkedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to update bookmark in Firestore:", err);
    }
  };

  // Sync hash routing for shareable URL links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/apps/')) {
        const slug = hash.replace('#/apps/', '');
        const appExists = apps.some(a => a.slug === slug);
        if (appExists) {
          setSelectedAppSlug(slug);
          setCurrentView('detail');
        } else {
          setCurrentView('home');
        }
      } else if (hash === '#/all') {
        setCurrentView('all');
      } else if (hash === '#/bookmarks') {
        setCurrentView('bookmarks');
      } else if (hash === '#/categories') {
        setCurrentView('categories');
      } else if (hash.startsWith('#/category/')) {
        const cat = hash.replace('#/category/', '');
        // find category in lists matching lower or space-replaced
        const matchedCat = CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
        if (matchedCat) {
          setFilters(prev => ({ ...prev, category: matchedCat }));
          setCurrentView('all');
        } else {
          setCurrentView('home');
        }
      } else {
        const staticViews = ['about', 'contact', 'sitemap', 'donate', 'disclaimer', 'dmca', 'privacy', 'terms'];
        const potentialStatic = hash.replace('#/', '');
        if (staticViews.includes(potentialStatic)) {
          setCurrentView(potentialStatic);
        } else {
          setCurrentView('home');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Trigger on initial mount
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update navigation and sync window Hash URL (Item 18 SEO compliant URL formats)
  const navigateTo = (view: string, slug?: string) => {
    setLoading(true);
    setTimeout(() => {
      if (view === 'home') {
        window.location.hash = '';
        setSelectedAppSlug(null);
        setCurrentView('home');
      } else if (view === 'all') {
        window.location.hash = '/all';
        setSelectedAppSlug(null);
        setCurrentView('all');
      } else if (view === 'bookmarks') {
        window.location.hash = '/bookmarks';
        setSelectedAppSlug(null);
        setCurrentView('bookmarks');
      } else if (view === 'categories') {
        window.location.hash = '/categories';
        setSelectedAppSlug(null);
        setCurrentView('categories');
      } else if (view === 'detail' && slug) {
        window.location.hash = `/apps/${slug}`;
        setSelectedAppSlug(slug);
        setCurrentView('detail');
      } else {
        window.location.hash = `/${view}`;
        setSelectedAppSlug(null);
        setCurrentView(view);
      }
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  // Active app for details view
  const selectedAppObj = apps.find(a => a.slug === selectedAppSlug || a.id === selectedAppSlug) || null;

  // Handle Direct Instant Download Simulation from cards
  const handleDirectDownload = (e: React.MouseEvent, app: AppData) => {
    e.stopPropagation(); // prevent card click select navigation
    navigateTo('detail', app.slug);
    // Smooth scroll to the download block on details page
    setTimeout(() => {
      const el = document.getElementById('download-workflow-module');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigateTo('all');
  };

  const handleSearchFocus = () => {
    navigateTo('all');
    setTimeout(() => {
      const input = document.getElementById('search-input-field');
      if (input) input.focus();
    }, 550);
  };

  // Utility helpers for advanced filtering
  const parseSizeToMB = (sizeStr: string): number => {
    const clean = sizeStr.toLowerCase().trim();
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    if (clean.includes('gb')) {
      return num * 1024;
    }
    return num;
  };

  const parseAndroidVersion = (verStr: string): number => {
    const match = verStr.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Filter and Sort dataset calculations
  const filteredApps = apps.filter((app) => {
    // Search query match
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter match
    const matchesCategory = filters.category === '' || app.category === filters.category;

    // Rating filter match
    const matchesRating = filters.rating === '' || app.rating >= parseFloat(filters.rating);

    // Version requirement match
    const matchesVersion = filters.version === '' || app.androidVersion.includes(filters.version) || app.androidVersion >= filters.version;

    // Recently updated match (arbitrary threshold like mid-August 2026)
    const matchesRecent = !filters.recentlyUpdated || new Date(app.updatedAt) >= new Date('2026-08-15');

    // Advanced Filter: File Size (Small <= 25MB, Medium 25-75MB, Large > 75MB)
    let matchesSize = true;
    if (filters.size) {
      const mbSize = parseSizeToMB(app.size);
      if (filters.size === 'small') {
        matchesSize = mbSize <= 25;
      } else if (filters.size === 'medium') {
        matchesSize = mbSize > 25 && mbSize <= 75;
      } else if (filters.size === 'large') {
        matchesSize = mbSize > 75;
      }
    }

    // Advanced Filter: Minimum Android Version requirement compatibility
    let matchesMinAndroid = true;
    if (filters.minAndroid) {
      const appMinVer = parseAndroidVersion(app.androidVersion);
      const reqMinVer = parseFloat(filters.minAndroid);
      matchesMinAndroid = appMinVer <= reqMinVer;
    }

    // Advanced Filter: Last Updated Date Range (Today, This Week, This Month, This Year)
    let matchesDate = true;
    if (filters.updatedDateRange) {
      const appDate = new Date(app.updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - appDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filters.updatedDateRange === 'today') {
        matchesDate = diffDays <= 1;
      } else if (filters.updatedDateRange === 'week') {
        matchesDate = diffDays <= 7;
      } else if (filters.updatedDateRange === 'month') {
        matchesDate = diffDays <= 30;
      } else if (filters.updatedDateRange === 'year') {
        matchesDate = diffDays <= 365;
      }
    }

    return matchesSearch && matchesCategory && matchesRating && matchesVersion && matchesRecent && matchesSize && matchesMinAndroid && matchesDate;
  });

  // Sort calculations
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'a-z') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'z-a') {
      return b.name.localeCompare(a.name);
    }
    // Default popular sorted by download counts
    return b.downloads - a.downloads;
  });

  // Get recommendations excluding active app (maximum 4)
  const getRelatedApps = (currentApp: AppData) => {
    return apps
      .filter((a) => a.id !== currentApp.id && a.category === currentApp.category)
      .slice(0, 4);
  };

  // Get active app for details view
  const activeApp = apps.find(a => a.slug === selectedAppSlug) || apps[0];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark bg-[#0F1115] text-slate-100' : 'bg-slate-50/30 text-slate-900'}`}>

      {/* Dynamic SEO Meta & JSON-LD Manager */}
      <DynamicSEO 
        currentView={currentView} 
        selectedApp={selectedAppObj} 
        categoryFilter={filters.category} 
      />

      {/* Navigation Header bar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSearchFocus={handleSearchFocus}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 w-full pb-16">

        {/* Loading overlay for routing feel */}
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <LoadingSkeleton type={currentView === 'detail' ? 'detail' : 'grid'} count={8} />
          </div>
        ) : (
          <>
            {/* View mapping */}
            {currentView === 'home' && (
              <div className="space-y-16 animate-fade-in">
                {/* Brand Hero */}
                <Hero
                  searchQuery={searchQuery}
                  onSearchChange={(q) => {
                    setSearchQuery(q);
                  }}
                  onSearchSubmit={(e) => {
                    e.preventDefault();
                    navigateTo('all');
                  }}
                  onTagClick={handleTagClick}
                  onExploreClick={() => navigateTo('all')}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                  {/* Featured apps section */}
                  <section className="space-y-6" id="home-featured-apps">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Aplikasi Pilihan Redaksi
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Aplikasi premium yang direkomendasikan karena stabilitas dan kegunaannya.
                        </p>
                      </div>
                      <button
                        onClick={() => navigateTo('all')}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Lihat Semua
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {apps.filter(a => a.featured).slice(0, 4).map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(s) => navigateTo('detail', s)}
                          onDownload={handleDirectDownload}
                        />
                      ))}
                    </div>
                  </section>

                  {/* ⬇️ IKLAN ADSENSE #1: Banner horizontal di bawah Featured */}
                  <AdSense 
                    adSlot="1234567890" 
                    adFormat="horizontal" 
                    className="my-6"
                  />

                  {/* Popular apps section (different hierarchy: grid representation) */}
                  <section className="space-y-6" id="home-popular-apps">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Aplikasi Terpopuler
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Paling banyak dicari dan diunduh oleh jutaan pengguna minggu ini.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSortBy('popular');
                          navigateTo('all');
                        }}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Tampilkan Peringkat
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {apps.filter(a => a.popular).slice(0, 8).map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(s) => navigateTo('detail', s)}
                          onDownload={handleDirectDownload}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Latest apps section (fresh additions) */}
                  <section className="space-y-6" id="home-latest-apps">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                          Baru Ditambahkan
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          File APK terbaru yang diunggah dan disetujui tim audit AeroAPK.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSortBy('latest');
                          navigateTo('all');
                        }}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Lihat Terbaru
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {/* sort by date updatedAt */}
                      {[...apps].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4).map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(s) => navigateTo('detail', s)}
                          onDownload={handleDirectDownload}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Popular Categories */}
                  <section className="space-y-6" id="home-categories">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                        Jelajahi Berdasarkan Kategori
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                        Pilih jenis kategori untuk mengerucutkan pencarian utilitas penunjang harian Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {CATEGORIES.map((cat) => {
                        const count = apps.filter(a => a.category === cat).length;
                        return (
                          <CategoryCard
                            key={cat}
                            category={cat}
                            appCount={count}
                            isSelected={filters.category === cat}
                            onSelect={(c) => {
                              setFilters(prev => ({ ...prev, category: c }));
                              navigateTo('all');
                            }}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {/* Newsletter subscription module natural design */}
                  <Newsletter />
                </div>
              </div>
            )}

            {currentView === 'all' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Jelajahi File APK Android
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Gunakan panel filter lanjutan untuk menemukan rilis aplikasi yang paling sesuai bagi perangkat Anda.
                  </p>
                </div>

                {/* Search Bar filtering module */}
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filters={filters}
                  onFiltersChange={setFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  totalResults={sortedApps.length}
                />

                {/* ⬇️ IKLAN ADSENSE #2: Banner di atas daftar aplikasi */}
                <AdSense 
                  adSlot="1234567891" 
                  adFormat="horizontal" 
                  className="my-4"
                />

                {/* Main listings Grid container */}
                <AppGrid
                  apps={sortedApps}
                  onSelect={(s) => navigateTo('detail', s)}
                  onDownload={handleDirectDownload}
                  onResetSearch={() => {
                    setSearchQuery('');
                    setFilters({ category: '', rating: '', version: '', recentlyUpdated: false });
                  }}
                  pageSize={8}
                />
              </div>
            )}

            {currentView === 'categories' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Kategori Aplikasi Android
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Klasifikasi cerdas aplikasi untuk mempermudah pencarian kebutuhan ponsel cerdas Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {CATEGORIES.map((cat) => {
                    const count = apps.filter(a => a.category === cat).length;
                    return (
                      <CategoryCard
                        key={cat}
                        category={cat}
                        appCount={count}
                        isSelected={false}
                        onSelect={(c) => {
                          setFilters(prev => ({ ...prev, category: c }));
                          navigateTo('all');
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {(currentView === 'recently-updated' || currentView === 'updated') && (
              <RecentlyUpdatedPage
                apps={apps}
                onSelectApp={(s) => navigateTo('detail', s)}
                onDownloadApp={handleDirectDownload}
                onNavigate={navigateTo}
              />
            )}

            {currentView === 'detail' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <AppDetail
                  app={activeApp}
                  relatedApps={getRelatedApps(activeApp)}
                  onNavigate={navigateTo}
                  onSelectRelated={(s) => navigateTo('detail', s)}
                  onDownloadRelated={handleDirectDownload}
                  isBookmarked={bookmarks.includes(activeApp.id)}
                  onToggleBookmark={() => handleToggleBookmark(activeApp.id)}
                />

                {/* ⬇️ IKLAN ADSENSE #3: Di bawah detail aplikasi */}
                <div className="mt-8">
                  <AdSense 
                    adSlot="1234567892" 
                    adFormat="auto" 
                    className="my-6"
                  />
                </div>
              </div>
            )}

            {currentView === 'bookmarks' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Aplikasi Tersimpan Anda
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Daftar aplikasi favorit Anda yang disimpan dengan aman di Firestore.
                  </p>
                </div>

                {apps.filter(app => bookmarks.includes(app.id)).length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/10 rounded-2xl space-y-4">
                    <Bookmark className="h-12 w-12 text-slate-350 dark:text-slate-650 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">Belum ada aplikasi yang disimpan</p>
                      <p className="text-xs text-slate-450 dark:text-slate-450 mt-1 max-w-sm mx-auto">
                        Jelajahi galeri aplikasi kami dan klik tombol "Simpan" pada halaman detail aplikasi untuk menyimpannya di sini.
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('all')}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Jelajahi Sekarang
                    </button>
                  </div>
                ) : (
                  <AppGrid
                    apps={apps.filter(app => bookmarks.includes(app.id))}
                    onSelect={(s) => navigateTo('detail', s)}
                    onDownload={handleDirectDownload}
                    onResetSearch={() => {}}
                    pageSize={8}
                  />
                )}
              </div>
            )}

            {currentView === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
                {user && (user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com') ? (
                  <AdminPanel onNavigate={navigateTo} user={user} />
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">Akses Ditolak</h2>
                    <p className="text-xs text-slate-500">Halaman ini hanya dapat diakses oleh operator administrator berwenang.</p>
                  </div>
                )}
              </div>
            )}

            {/* Static Content Views */}
            {currentView === 'about' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Tentang AeroAPK Downloader
                </h1>
                <p className="text-sm sm:text-base text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  AeroAPK lahir dari komitmen kuat untuk menyediakan ekosistem unduhan aplikasi Android yang jujur, transparan, dan berkelas dunia untuk masyarakat Indonesia. 
                </p>
                <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                  Kami menyadari banyak sekali situs APK Downloader yang memaksakan unduhan tersembunyi, tombol unduh palsu yang mengarahkan ke virus/iklan pop-up agresif, serta melakukan modifikasi kode yang membahayakan privasi perangkat pengguna. Di AeroAPK, kami memutus rantai buruk tersebut. 
                </p>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">Jaminan AeroAPK:</h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mt-2 font-medium">
                    <li>✓ 100% Berkas APK Asli Google Play Store tanpa modifikasi kode berbahaya.</li>
                    <li>✓ Integrasi deteksi malware instan dengan engine Antivirus SHA-256 cloud.</li>
                    <li>✓ Server berkecepatan tinggi tanpa throttling atau batasan limit download bulanan.</li>
                  </ul>
                </div>
              </div>
            )}

            {currentView === 'contact' && (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Hubungi AeroAPK
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Punya saran kemitraan, permohonan penambahan rilis aplikasi APK baru, ataupun keluhan lainnya? Kirimkan pesan Anda melalui form di bawah ini secara instan:
                </p>

                {contactSubmitted ? (
                  <div className="p-6 bg-blue-50/10 dark:bg-blue-950/20 border border-blue-500/20 dark:border-blue-800 rounded-3xl text-center space-y-3 animate-fade-in">
                    <CheckCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Pesan Anda Berhasil Terkirim!</h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400">Terima kasih atas partisipasi Anda menghubungi kami. Tim teknis AeroAPK akan merespon email Anda dalam waktu 1x24 jam kerja.</p>
                    <button
                      onClick={() => {
                        setContactForm({ name: '', email: '', message: '' });
                        setContactSubmitted(false);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Kirim Pesan Baru
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!contactForm.name || !contactForm.email || !contactForm.message) {
                        alert('Silakan lengkapi semua isian formulir.');
                        return;
                      }
                      setContactSubmitted(true);
                    }}
                    className="space-y-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 p-6 rounded-3xl shadow-sm"
                    id="contact-form"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama lengkap..."
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Alamat Email</label>
                      <input
                        type="email"
                        placeholder="contoh@gmail.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Isi Pesan</label>
                      <textarea
                        rows={5}
                        placeholder="Ketik rincian pesan atau keluhan Anda di sini..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl text-sm font-bold shadow transition-all cursor-pointer"
                    >
                      Kirim Pesan
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentView === 'sitemap' && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Peta Situs AeroAPK
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold -mt-4">
                  Daftar indeks lengkap seluruh kategori dan berkas aplikasi yang terdaftar di AeroAPK.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-sm text-blue-500 dark:text-blue-400 uppercase tracking-wider">Kategori</h3>
                    <ul className="space-y-2 text-xs font-bold text-slate-650 dark:text-slate-350">
                      {CATEGORIES.map(c => (
                        <li key={c}>
                          <button
                            onClick={() => {
                              setFilters(prev => ({ ...prev, category: c }));
                              navigateTo('all');
                            }}
                            className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                          >
                            • Kategori {c}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-sm text-blue-500 dark:text-blue-400 uppercase tracking-wider">Daftar Aplikasi</h3>
                    <ul className="space-y-2.5 text-xs font-bold text-slate-650 dark:text-slate-350">
                      {apps.map(app => (
                        <li key={app.id}>
                          <button
                            onClick={() => navigateTo('detail', app.slug)}
                            className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer text-left"
                          >
                            • Unduh {app.name} APK v{app.version}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'donate' && (
              <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-center animate-fade-in">
                <Wallet className="h-12 w-12 text-blue-500 mx-auto" />
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Dukung Perkembangan AeroAPK
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  AeroAPK beroperasi penuh dari kantong mandiri tim developer kami tanpa menyajikan iklan yang menipu ataupun malware berbahaya. Apabila Anda merasa terbantu, dukung server operasional kami:
                </p>

                <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-4">
                  <div className="w-48 h-48 bg-slate-150 dark:bg-black/35 rounded-2xl mx-auto flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10">
                    <span className="text-xs text-slate-400 font-extrabold">Simulasi QRIS Scan</span>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold">
                    Scan menggunakan dompet digital Gopay, OVO, Dana, LinkAja, atau m-Banking Anda.
                  </p>
                  <div className="flex justify-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 dark:bg-white/5 rounded text-slate-550 dark:text-slate-400">DANA: 0812-3456-7890</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 dark:bg-white/5 rounded text-slate-550 dark:text-slate-400">PayPal: donasi@aeroapk.com</span>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'disclaimer' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Penolakan Jaminan (Disclaimer)
                </h1>
                <p className="text-sm sm:text-base text-slate-650 dark:text-slate-350 font-semibold">
                  Semua berkas APK yang disajikan di situs AeroAPK diperoleh secara terbuka dari sumber-sumber legal terpercaya di internet. 
                </p>
                <div className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed space-y-4">
                  <p>
                    Layanan AeroAPK ditujukan murni sebagai sarana edukasi teknis, pembelajaran, uji coba kompabilitas sistem operasi Android, ataupun instalasi pada gawai yang tidak memiliki akses default ke Google Play Store (seperti Huawei, dsb).
                  </p>
                  <p>
                    Kami tidak memberikan garansi fungsionalitas penuh ataupun pertanggungjawaban ganti-rugi apabila terjadi kehilangan data, kerusakan sistem firmware perangkat, pemblokiran akun in-game pihak ketiga, ataupun permasalahan lain akibat dari pemasangan aplikasi APK dari server kami. Semua tanggung jawab instalasi diserahkan sepenuhnya secara mandiri kepada pengguna perangkat bersangkutan (Do With Your Own Risk).
                  </p>
                </div>
              </div>
            )}

            {currentView === 'dmca' && (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  DMCA / Hak Cipta
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Kami sepenuhnya menghormati hak kekayaan intelektual (HAKI) dan hak cipta para pemilik aslinya. Jika rilis APK Anda terbit di situs kami dan Anda menghendaki penghapusannya, silakan kirimkan laporan DMCA resmi:
                </p>

                {dmcaSubmitted ? (
                  <div className="p-6 bg-blue-50/10 dark:bg-blue-950/20 border border-blue-500/20 dark:border-blue-800 rounded-3xl text-center space-y-3 animate-fade-in">
                    <CheckCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Laporan Berhasil Diterima!</h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400">Tim Legal AeroAPK akan memvalidasi bukti kepemilikan dan melakukan takedown file APK terkait dalam waktu kurang dari 24 jam.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!dmcaForm.appName || !dmcaForm.url || !dmcaForm.email || !dmcaForm.description) {
                        alert('Silakan lengkapi formulir laporan DMCA.');
                        return;
                      }
                      setDmcaSubmitted(true);
                    }}
                    className="space-y-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 p-6 rounded-3xl shadow-sm"
                    id="dmca-form"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nama Aplikasi Terkait</label>
                      <input
                        type="text"
                        placeholder="Ketik nama aplikasi yang dilaporkan..."
                        value={dmcaForm.appName}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, appName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tautan URL di AeroAPK</label>
                      <input
                        type="text"
                        placeholder="https://aeroapk.com/#/apps/example..."
                        value={dmcaForm.url}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, url: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Email Pemilik Hak Cipta</label>
                      <input
                        type="email"
                        placeholder="legal@developername.com"
                        value={dmcaForm.email}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi Bukti Kepemilikan Hak Cipta</label>
                      <textarea
                        rows={4}
                        placeholder="Lampirkan tautan playstore resmi atau dokumen kepemilikan paten yang sah..."
                        value={dmcaForm.description}
                        onChange={(e) => setDmcaForm({ ...dmcaForm, description: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow transition-all cursor-pointer"
                    >
                      Kirim Laporan Takedown
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentView === 'privacy' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Kebijakan Privasi
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold -mt-4">
                  Terakhir Diperbarui: Agustus 2026
                </p>
                <div className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed space-y-4">
                  <p>
                    AeroAPK sangat menghargai dan menjamin kerahasiaan informasi pribadi pengunjung kami. Kami tidak pernah meminta pendaftaran akun wajib, login media sosial, data nomor HP, ataupun informasi perbankan rahasia dari perangkat Anda.
                  </p>
                  <p>
                    <strong>Cookie & Pihak Ketiga:</strong> Kami menggunakan cookie browser sederhana untuk menyimpan preferensi tampilan mode Gelap/Terang Anda guna kelancaran bernavigasi. Tidak ada pertukaran tracker jahat dengan pihak ketiga eksternal yang melanggar ketentuan privasi Anda.
                  </p>
                </div>
              </div>
            )}

            {currentView === 'terms' && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-fade-in">
                <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                  Syarat & Ketentuan Penggunaan
                </h1>
                <div className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed space-y-4">
                  <p>
                    Dengan mengakses dan menggunakan situs AeroAPK Downloader, Anda menyetujui seluruh ketentuan layanan hukum, termasuk disclaimer penolakan pertanggungjawaban yang kami miliki.
                  </p>
                  <p>
                    Anda dilarang keras mematikan perlindungan antivirus sistem, melakukan scraping data secara brutal menggunakan bot, ataupun menuntut AeroAPK atas segala kerugian teknis akibat penyalahgunaan file aplikasi APK eksternal di luar pengawasan kami.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer information section */}
      <Footer
        onNavigate={navigateTo}
        onCategorySelect={(c) => {
          setFilters(prev => ({ ...prev, category: c }));
          navigateTo('all');
        }}
      />
    </div>
  );
}
