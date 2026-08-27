import React, { useState } from 'react';
import { Download, Sun, Moon, Menu, X, Search, Grid, HelpCircle, LogIn, LogOut, Bookmark, User as UserIcon, ChevronDown, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus: () => void;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onSearchFocus,
  user,
  onSignIn,
  onSignOut
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: 'Beranda', view: 'home' },
    { label: '🆕 Baru Diperbarui', view: 'recently-updated' },
    { label: 'Semua Aplikasi', view: 'all' },
    { label: 'Kategori', view: 'categories' },
    ...(user ? [{ label: 'Tersimpan', view: 'bookmarks' }] : [])
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => {
              onNavigate('home');
              setIsOpen(false);
            }}
            id="nav-logo"
          >
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <Download className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                AeroAPK
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide -mt-0.5">
                FAST DOWNLOADER
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  id={`nav-item-${item.view}`}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/30 border border-blue-500/10'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onSearchFocus}
              className="p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
              title="Cari Aplikasi"
              id="desktop-search-trigger"
            >
              <Search className="h-5 w-5" />
            </button>
            
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
              title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
              id="theme-toggle"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Google Sign-In / Auth Button */}
            {user === null ? (
              <button
                onClick={onSignIn}
                id="signin-btn"
                className="ml-1.5 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Masuk</span>
              </button>
            ) : (
              <div className="relative ml-1.5">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer"
                  id="profile-dropdown-trigger"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User Avatar"}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-lg">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-450" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#13161C] border border-slate-150 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-fade-in">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.01]">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{user.displayName}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-450 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigate('bookmarks');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4 text-blue-500" />
                        <span>Aplikasi Tersimpan</span>
                      </button>
                      {user && (user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com') && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/[0.02] flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-white/5"
                        >
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <span>Panel Admin</span>
                        </button>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onSearchFocus}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              id="mobile-search-trigger"
            >
              <Search className="h-5.5 w-5.5" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              id="mobile-theme-toggle"
            >
              {darkMode ? <Sun className="h-5.5 w-5.5" /> : <Moon className="h-5.5 w-5.5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="Toggle menu"
              id="mobile-menu-trigger"
            >
              {isOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu panel */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="px-3 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onNavigate(item.view);
                    setIsOpen(false);
                  }}
                  id={`mobile-nav-item-${item.view}`}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span>{item.label}</span>
                  <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />
                </button>
              );
            })}

            {/* Mobile Auth Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 px-4">
              {user === null ? (
                <button
                  onClick={() => {
                    onSignIn();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Akun Google</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-lg">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  
                  {user && (user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com') && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold cursor-pointer hover:bg-red-500/15 transition-colors"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Panel Admin</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      onSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar dari AeroAPK</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
