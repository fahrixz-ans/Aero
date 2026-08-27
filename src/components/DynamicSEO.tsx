import React, { useEffect } from 'react';
import { AppData } from '../types';

interface DynamicSEOProps {
  currentView: string;
  selectedApp?: AppData | null;
  categoryFilter?: string;
}

export default function DynamicSEO({ currentView, selectedApp, categoryFilter }: DynamicSEOProps) {
  useEffect(() => {
    let title = 'AeroAPK - Pusat APK Downloader Android Resmi, Aman & Cepat';
    let description = 'AeroAPK adalah platform download APK Android gratis, resmi, cepat, dan terpercaya di Indonesia. Unduh ribuan aplikasi, game, dan utilitas Android terverifikasi aman.';
    let canonicalUrl = 'https://aero-apk.vercel.app/';
    let ogImage = 'https://raw.githubusercontent.com/fahrixz-ans/Aero/main/public/favicon.svg';
    let jsonLdData: any = null;

    if (currentView === 'detail' && selectedApp) {
      title = `Download ${selectedApp.name} APK v${selectedApp.version} Terbaru untuk Android - AeroAPK`;
      description = `Unduh APK ${selectedApp.name} versi ${selectedApp.version} resmi dari pengembang ${selectedApp.developer}. Ukuran ${selectedApp.size}, aman, terverifikasi, dan siap pasang gratis di Android.`;
      canonicalUrl = `https://aero-apk.vercel.app/#/apps/${selectedApp.id}`;
      ogImage = selectedApp.icon || ogImage;

      // SoftwareApplication Schema
      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': selectedApp.name,
        'operatingSystem': selectedApp.androidVersion || 'Android',
        'applicationCategory': selectedApp.category || 'UtilitiesApplication',
        'softwareVersion': selectedApp.version,
        'fileSize': selectedApp.size,
        'dateModified': selectedApp.updatedAt || '2026-08-26',
        'author': {
          '@type': 'Organization',
          'name': selectedApp.developer
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'AeroAPK',
          'url': 'https://aero-apk.vercel.app/'
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': selectedApp.rating || 4.5,
          'ratingCount': Math.max(100, Math.floor((selectedApp.downloads || 1000) / 100)),
          'bestRating': '5',
          'worstRating': '1'
        },
        'description': selectedApp.description,
        'image': selectedApp.icon,
        'screenshot': selectedApp.screenshots || [],
        'downloadUrl': selectedApp.officialDownloadUrl || selectedApp.downloadUrl
      };
    } else if (currentView === 'categories' || categoryFilter) {
      const activeCat = categoryFilter || 'Semua Kategori';
      title = `Download APK Kategori ${activeCat} Android Terbaik & Terpopuler - AeroAPK`;
      description = `Jelajahi dan unduh aplikasi APK Android terbaik di kategori ${activeCat}. Gratis, aman, dan versi terbaru terverifikasi.`;
      canonicalUrl = `https://aero-apk.vercel.app/category/${encodeURIComponent(activeCat.toLowerCase())}`;

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Koleksi APK Kategori ${activeCat}`,
        'description': description,
        'url': canonicalUrl,
        'isPartOf': {
          '@type': 'WebSite',
          'name': 'AeroAPK',
          'url': 'https://aero-apk.vercel.app'
        },
        'breadcrumb': {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Beranda',
              'item': 'https://aero-apk.vercel.app/'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Kategori',
              'item': 'https://aero-apk.vercel.app/category'
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': activeCat,
              'item': canonicalUrl
            }
          ]
        }
      };
    } else if (currentView === 'recently-updated') {
      title = 'Aplikasi Android APK yang Baru Diperbarui - AeroAPK';
      description = 'Daftar aplikasi dan game Android APK versi terbaru yang baru saja mendapatkan pembaruan dan rilis resmi.';
      canonicalUrl = 'https://aero-apk.vercel.app/recently-updated';
    } else if (currentView === 'dmca') {
      title = 'DMCA & Hak Cipta - AeroAPK';
      description = 'Kebijakan DMCA dan prosedur klaim pelanggaran hak cipta resmi AeroAPK.';
      canonicalUrl = 'https://aero-apk.vercel.app/dmca';
    } else if (currentView === 'privacy') {
      title = 'Kebijakan Privasi (Privacy Policy) - AeroAPK';
      description = 'Kebijakan privasi AeroAPK mengenai perlindungan data dan keamanan privasi pengguna.';
      canonicalUrl = 'https://aero-apk.vercel.app/privacy-policy';
    } else if (currentView === 'terms') {
      title = 'Syarat & Ketentuan Layanan - AeroAPK';
      description = 'Syarat dan ketentuan penggunaan platform downloader APK AeroAPK.';
      canonicalUrl = 'https://aero-apk.vercel.app/terms';
    } else if (currentView === 'contact') {
      title = 'Hubungi Kami - AeroAPK';
      description = 'Layanan bantuan, pertanyaan kemitraan, dan kontak resmi tim AeroAPK.';
      canonicalUrl = 'https://aero-apk.vercel.app/contact';
    }

    // 1. Update Document Title
    document.title = title;

    // 2. Helper to set/update Meta tags
    const setMetaTag = (nameOrProp: string, value: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', nameOrProp);
        } else {
          el.setAttribute('name', nameOrProp);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMetaTag('description', description);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // 3. Update Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Inject Dynamic JSON-LD Structured Data
    const existingDynamicScript = document.getElementById('dynamic-jsonld-schema');
    if (existingDynamicScript) {
      existingDynamicScript.remove();
    }

    if (jsonLdData) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLdData);
      document.head.appendChild(script);
    }

    return () => {
      const cleanupScript = document.getElementById('dynamic-jsonld-schema');
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [currentView, selectedApp, categoryFilter]);

  return null;
        }
