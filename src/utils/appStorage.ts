// Persistent storage helpers for deleted apps blacklist and custom categories
// Ensures smooth operation even across static data fallbacks and iframe sandbox environments.

const DELETED_APPS_KEY = 'aeroapk_deleted_app_ids';
const CUSTOM_CATEGORIES_KEY = 'aeroapk_custom_categories';
const DELETED_CATEGORIES_KEY = 'aeroapk_deleted_categories';

export const getDeletedAppIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading deleted app IDs:', err);
    return [];
  }
};

export const addDeletedAppId = (appId: string): void => {
  try {
    const existing = getDeletedAppIds();
    if (!existing.includes(appId)) {
      const updated = [...existing, appId];
      localStorage.setItem(DELETED_APPS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving deleted app ID:', err);
  }
};

export const addDeletedAppIds = (appIds: string[]): void => {
  try {
    const existing = getDeletedAppIds();
    const merged = Array.from(new Set([...existing, ...appIds]));
    localStorage.setItem(DELETED_APPS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error saving deleted app IDs:', err);
  }
};

export const getCustomCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading custom categories:', err);
    return [];
  }
};

export const saveCustomCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving custom categories:', err);
  }
};

export const getDeletedCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const addDeletedCategory = (catName: string): void => {
  try {
    const existing = getDeletedCategories();
    if (!existing.includes(catName.toLowerCase())) {
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify([...existing, catName.toLowerCase()]));
    }
  } catch (err) {
    console.error('Error saving deleted category:', err);
  }
};

export const removeDeletedCategory = (catName: string): void => {
  try {
    const existing = getDeletedCategories();
    const filtered = existing.filter(c => c !== catName.toLowerCase());
    localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error updating deleted category:', err);
  }
};
