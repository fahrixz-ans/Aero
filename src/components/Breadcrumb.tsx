import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  paths: { label: string; view?: string; slug?: string }[];
  onNavigate: (view: string, slug?: string) => void;
}

export default function Breadcrumb({ paths, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb" id="breadcrumb-navigation">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-sm font-medium">
        <li className="inline-flex items-center">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
            id="breadcrumb-home"
          >
            <Home className="w-4 h-4 mr-2" />
            <span>Beranda</span>
          </button>
        </li>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1 md:mx-2 shrink-0" />
              {isLast ? (
                <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[180px] md:max-w-xs">
                  {path.label}
                </span>
              ) : (
                <button
                  onClick={() => path.view && onNavigate(path.view, path.slug)}
                  className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  {path.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
