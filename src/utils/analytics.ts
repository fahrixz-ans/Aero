import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { AppData, AnalyticsEventType } from '../types';

// Helper to get or generate an anonymous session identifier
export function getAnonymousSessionId(): string {
  try {
    let sid = sessionStorage.getItem('aero_analytics_sid');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('aero_analytics_sid', sid);
    }
    return sid;
  } catch {
    return 'sid_default';
  }
}

// Track an interaction event to Firestore and update app counters atomically
export async function trackAnalyticsEvent(
  type: AnalyticsEventType,
  applicationId?: string | null,
  searchQuery?: string | null
): Promise<void> {
  try {
    const sessionId = getAnonymousSessionId();
    const eventData = {
      type,
      applicationId: applicationId || null,
      searchQuery: searchQuery ? searchQuery.trim().toLowerCase() : null,
      sessionId,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    };

    // 1. Write event record into analyticsEvents collection
    try {
      await addDoc(collection(db, 'analyticsEvents'), eventData);
    } catch (e) {
      // Non-blocking catch if permissions fail
      console.warn('Analytics event write notice:', e);
    }

    // 2. Atomically update the target application's analytics object in Firestore
    if (applicationId) {
      const appRef = doc(db, 'applications', applicationId);
      const updatePayload: Record<string, any> = {};

      if (type === 'application_view') {
        // Prevent repeated view spam within the same session for the same app
        const viewKey = `viewed_${applicationId}`;
        if (sessionStorage.getItem(viewKey)) return;
        sessionStorage.setItem(viewKey, '1');

        updatePayload['analytics.views'] = increment(1);
        updatePayload['trendingScore'] = increment(1.0);
      } else if (type === 'official_download_click') {
        updatePayload['analytics.officialClicks'] = increment(1);
        updatePayload['downloads'] = increment(1);
        updatePayload['trendingScore'] = increment(3.0);
      } else if (type === 'alternative_download_click') {
        updatePayload['analytics.alternativeClicks'] = increment(1);
        updatePayload['downloads'] = increment(1);
        updatePayload['trendingScore'] = increment(2.0);
      }

      if (Object.keys(updatePayload).length > 0) {
        try {
          await updateDoc(appRef, updatePayload);
        } catch (e) {
          // Graceful fallback for non-admin sessions if rule requires
        }
      }
    }
  } catch (err) {
    // Non-blocking silent logger
    console.debug('Analytics logging skipped:', err);
  }
}

/**
 * Calculates a dynamic Trending Score based on views, clicks, searches, and recency
 */
export function calculateTrendingScore(app: AppData): number {
  const views = app.analytics?.views || 0;
  const officialClicks = app.analytics?.officialClicks || 0;
  const altClicks = app.analytics?.alternativeClicks || 0;
  const searchFreq = app.analytics?.searchFrequency || 0;
  const recentGrowth = app.recentGrowth || 0;

  // Base weighted score
  const baseScore = (views * 1.0) + (officialClicks * 3.0) + (altClicks * 2.0) + (searchFreq * 1.5) + (recentGrowth * 2.5);

  // Recency bonus: boost if updated recently (within 7 days)
  let recencyMultiplier = 1.0;
  if (app.updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 3) recencyMultiplier = 1.5;
    else if (daysSinceUpdate <= 7) recencyMultiplier = 1.25;
    else if (daysSinceUpdate <= 14) recencyMultiplier = 1.1;
  }

  // Baseline download factor
  const baselineFactor = Math.min(50, Math.log10(Math.max(10, app.downloads)) * 5);

  return Math.round((baseScore + baselineFactor) * recencyMultiplier * 10) / 10;
}

/**
 * Sorts applications by dynamic Trending Score
 */
export function getTrendingApplications(apps: AppData[], limitCount: number = 6): AppData[] {
  return [...apps]
    .filter(app => app.status === 'published')
    .map(app => ({
      ...app,
      trendingScore: app.trendingScore || calculateTrendingScore(app)
    }))
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
    .slice(0, limitCount);
}
