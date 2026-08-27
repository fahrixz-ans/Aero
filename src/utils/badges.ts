import { AppData, AppBadgeInfo } from '../types';

/**
 * Formats a date string or timestamp into dynamic relative Indonesian text
 * e.g., "Baru saja", "1 jam lalu", "2 hari lalu", "5 hari lalu", "1 minggu lalu", "2 minggu lalu"
 */
export function getRelativeTimeString(dateString?: string): string {
  if (!dateString) return 'Baru saja';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Baru saja';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit lalu`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} hari lalu`;
    }
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} minggu lalu`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} bulan lalu`;
    }
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} tahun lalu`;
  } catch (err) {
    return 'Baru saja';
  }
}

/**
 * Checks if a given date string is within the past X days
 */
export function isWithinPastDays(dateString?: string, days: number = 7): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  } catch {
    return false;
  }
}

/**
 * Validates whether an official download URL meets strict Verified Source criteria
 */
export function isValidVerifiedSourceUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.length > 3 && !parsed.hostname.includes(' ');
  } catch {
    return false;
  }
}

/**
 * Calculates dynamic badges for an application based on defined mathematical rules
 */
export function calculateAppBadges(app: AppData): AppBadgeInfo[] {
  const badges: AppBadgeInfo[] = [];

  // 1. NEW Badge: Created within 7 days
  const effectiveCreatedAt = app.createdAt || app.releaseDate;
  if (isWithinPastDays(effectiveCreatedAt, 7)) {
    const cls = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    badges.push({
      type: 'new',
      label: 'NEW',
      description: 'Aplikasi baru saja ditambahkan ke platform',
      colorClass: cls,
      styleClasses: cls
    });
  }

  // 2. UPDATED Badge: Updated within 7 days
  if (isWithinPastDays(app.updatedAt, 7)) {
    const relativeTime = getRelativeTimeString(app.updatedAt);
    const cls = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    badges.push({
      type: 'updated',
      label: 'UPDATED',
      description: `Aplikasi diperbarui ${relativeTime}`,
      colorClass: cls,
      styleClasses: cls
    });
  }

  // 3. FEATURED Badge
  if (app.featured) {
    const cls = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    badges.push({
      type: 'featured',
      label: 'FEATURED',
      description: 'Aplikasi pilihan editorial AeroAPK',
      colorClass: cls,
      styleClasses: cls
    });
  }

  // 4. POPULAR Badge: Explicit override OR threshold performance
  const isAutoPopular = (app.downloads >= 100000000) || ((app.analytics?.views || 0) >= 500) || ((app.trendingScore || 0) >= 50);
  if (app.popular || isAutoPopular) {
    const cls = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    badges.push({
      type: 'popular',
      label: 'POPULAR',
      description: 'Banyak diunduh dan dicari pengguna',
      colorClass: cls,
      styleClasses: cls
    });
  }

  // 5. VERIFIED SOURCE Badge: Strict criteria
  const isVerified = (app.verifiedSource === true || isValidVerifiedSourceUrl(app.officialDownloadUrl)) && isValidVerifiedSourceUrl(app.officialDownloadUrl || app.downloadUrl);
  if (isVerified) {
    const cls = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    badges.push({
      type: 'verified',
      label: 'VERIFIED SOURCE',
      description: 'Sumber berkas resmi dan terverifikasi aman melalui protokol HTTPS',
      colorClass: cls,
      styleClasses: cls
    });
  }

  return badges;
}
