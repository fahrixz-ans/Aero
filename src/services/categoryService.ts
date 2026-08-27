import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES as INITIAL_CATEGORIES } from '../data/appsData';
import { 
  getCustomCategories, 
  saveCustomCategories, 
  getDeletedCategories, 
  addDeletedCategory, 
  removeDeletedCategory 
} from '../utils/appStorage';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}

export const sanitizeCategorySlug = (name: string): string => {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'kategori';
};

/**
 * Loads all active categories from Firestore + LocalStorage + Defaults
 */
export const loadAllCategories = async (appCategories: string[] = []): Promise<string[]> => {
  const deletedCats = getDeletedCategories();
  const localCustom = getCustomCategories();
  
  let firestoreCats: string[] = [];

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    if (!snapshot.empty) {
      snapshot.forEach(d => {
        const data = d.data();
        const name = data.name || d.id;
        if (name && !deletedCats.includes(name.toLowerCase())) {
          firestoreCats.push(name.trim());
        }
      });
    }
  } catch (err) {
    console.warn('Firestore categories read warning (using local/fallback):', err);
  }

  // Combine initial categories, firestore categories, local custom categories, and app categories
  const allCandidates = [
    ...INITIAL_CATEGORIES,
    ...firestoreCats,
    ...localCustom,
    ...appCategories
  ];

  // Filter out deleted categories and deduplicate case-insensitively
  const seen = new Set<string>();
  const finalCategories: string[] = [];

  for (const cat of allCandidates) {
    const trimmed = cat.trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || deletedCats.includes(lower)) continue;
    if (!seen.has(lower)) {
      seen.add(lower);
      finalCategories.push(trimmed);
    }
  }

  // Keep custom categories synced in localStorage
  saveCustomCategories(finalCategories);

  return finalCategories;
};

/**
 * Creates or saves a new category to Firestore and LocalStorage
 */
export const addCategoryToDb = async (name: string, description?: string): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: 'Nama kategori minimal 2 karakter.', updatedList: [] };
  }

  const currentCats = await loadAllCategories();
  const exists = currentCats.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { success: false, error: `Kategori "${trimmed}" sudah ada di database.`, updatedList: currentCats };
  }

  // Remove from deleted list if previously deleted
  removeDeletedCategory(trimmed);

  const slug = sanitizeCategorySlug(trimmed);
  const categoryData: CategoryData = {
    id: slug,
    name: trimmed,
    slug,
    description: description?.trim() || '',
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'categories', slug);
    await setDoc(docRef, categoryData);
  } catch (err: any) {
    console.warn('Firestore category write notice (saving to local storage):', err);
  }

  const updatedList = [...currentCats, trimmed];
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};

/**
 * Deletes a category from Firestore, marks it deleted, and updates affected apps
 */
export const deleteCategoryFromDb = async (
  categoryName: string, 
  fallbackCategory: string = 'Utilities'
): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmed = categoryName.trim();
  if (!trimmed) {
    return { success: false, error: 'Nama kategori tidak valid.', updatedList: [] };
  }

  // Mark as deleted in storage
  addDeletedCategory(trimmed);

  const slug = sanitizeCategorySlug(trimmed);

  try {
    // 1. Delete category document
    const docRef = doc(db, 'categories', slug);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn('Firestore category delete notice:', err);
  }

  try {
    // 2. Re-assign any applications in Firestore using this category to fallbackCategory
    const appsSnapshot = await getDocs(collection(db, 'applications'));
    if (!appsSnapshot.empty) {
      const batch = writeBatch(db);
      let needsCommit = false;

      appsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.category && data.category.toLowerCase() === trimmed.toLowerCase()) {
          batch.update(docSnap.ref, { category: fallbackCategory });
          needsCommit = true;
        }
      });

      if (needsCommit) {
        await batch.commit();
      }
    }
  } catch (err: any) {
    console.warn('Firestore update affected apps warning:', err);
  }

  const currentCats = await loadAllCategories();
  const updatedList = currentCats.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};

/**
 * Renames an existing category across Firestore and applications
 */
export const renameCategoryInDb = async (
  oldName: string,
  newName: string
): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();

  if (!trimmedNew || trimmedNew.length < 2) {
    return { success: false, error: 'Nama baru kategori minimal 2 karakter.', updatedList: [] };
  }

  if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
    return { success: true, updatedList: await loadAllCategories() };
  }

  // Check if new name exists
  const currentCats = await loadAllCategories();
  if (currentCats.some(c => c.toLowerCase() === trimmedNew.toLowerCase())) {
    return { success: false, error: `Kategori "${trimmedNew}" sudah digunakan.`, updatedList: currentCats };
  }

  // Add new category
  await addCategoryToDb(trimmedNew);
  // Delete old category and reassign apps to new name
  await deleteCategoryFromDb(trimmedOld, trimmedNew);

  const updatedList = (await loadAllCategories()).filter(c => c.toLowerCase() !== trimmedOld.toLowerCase());
  if (!updatedList.includes(trimmedNew)) {
    updatedList.push(trimmedNew);
  }
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};
