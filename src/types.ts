export type AppStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type PublishMode = 'immediate' | 'scheduled';

export interface AppData {
  id: string;
  name: string;
  slug: string;
  developer: string;
  icon: string;
  screenshots: string[];
  description: string;
  category: string;
  categoryId?: string;
  version: string;
  size: string;
  androidVersion: string;
  rating: number;
  downloads: number;
  releaseDate: string;
  updatedAt: string;
  createdAt?: string;
  downloadUrl: string;
  officialDownloadUrl?: string; // made optional for initial fallback compatibility
  alternativeDownloadUrl?: string;
  featured: boolean;
  popular: boolean;
  whatsNew?: string;
  permissions?: string[];
  minSdk?: number | null;
  targetSdk?: number | null;
  signingCertificate?: {
    sha256: string | null;
    sha1: string | null;
    issuer: string | null;
    subject: string | null;
  } | null;
  status?: AppStatus; // Visibility
  publishMode?: PublishMode;
  publishAt?: string | null; // ISO Date String or null
  verifiedSource?: boolean;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  analytics?: {
    views: number;
    officialClicks: number;
    alternativeClicks: number;
    searchFrequency: number;
    recentGrowth?: number;
    lastInteractionAt?: string;
  };
  trendingScore?: number;
  recentGrowth?: number;
}

export interface ImportJob {
  id: string;
  adminId: string;
  adminEmail: string;
  fileName: string;
  totalItems: number;
  importedItems: number;
  skippedItems: number;
  failedItems: number;
  errors?: string[];
  createdAt: string;
}

export type AnalyticsEventType = 
  | 'application_view' 
  | 'official_download_click' 
  | 'alternative_download_click' 
  | 'application_search';

export interface AnalyticsEvent {
  id?: string;
  type: AnalyticsEventType;
  applicationId?: string | null;
  searchQuery?: string | null;
  sessionId?: string | null;
  createdAt?: string;
}

export interface AppBadgeInfo {
  type: 'new' | 'updated' | 'popular' | 'featured' | 'verified';
  label: string;
  description?: string;
  colorClass: string;
  styleClasses?: string;
}

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

export type SortOption = 'latest' | 'updated' | 'popular' | 'rating' | 'a-z' | 'z-a' | 'trending';

export interface FilterState {
  category: string;
  developer?: string;
  rating: string;
  version: string;
  recentlyUpdated: boolean;
  size: string; // "small" | "medium" | "large" | ""
  minAndroid: string; // "4.1+" | "5.0+" | "6.0+" | ""
  updatedDateRange: string; // "7-days" | "30-days" | "90-days" | ""
  sort?: SortOption;
}
