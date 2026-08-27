import React from 'react';
import { 
  Users, Gamepad2, Film, CheckSquare, GraduationCap, 
  Camera, Music, Video, Wrench, MessageSquare, 
  Wallet, ShieldCheck, HelpCircle 
} from 'lucide-react';

interface CategoryCardProps {
  key?: string;
  category: string;
  appCount: number;
  isSelected: boolean;
  onSelect: (category: string) => void;
}

// Map each category to an elegant icon and styled theme color
const categoryConfigs: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  'Social': { icon: Users, color: 'from-blue-500 to-indigo-500' },
  'Games': { icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
  'Entertainment': { icon: Film, color: 'from-amber-500 to-orange-500' },
  'Productivity': { icon: CheckSquare, color: 'from-teal-500 to-emerald-500' },
  'Education': { icon: GraduationCap, color: 'from-rose-500 to-pink-500' },
  'Photography': { icon: Camera, color: 'from-cyan-500 to-blue-500' },
  'Music': { icon: Music, color: 'from-violet-500 to-indigo-500' },
  'Video': { icon: Video, color: 'from-red-500 to-orange-500' },
  'Tools': { icon: Wrench, color: 'from-slate-500 to-slate-700' },
  'Communication': { icon: MessageSquare, color: 'from-emerald-500 to-teal-500' },
  'Finance': { icon: Wallet, color: 'from-amber-600 to-yellow-500' },
  'Utilities': { icon: ShieldCheck, color: 'from-slate-600 to-slate-800' }
};

export default function CategoryCard({ category, appCount, isSelected, onSelect }: CategoryCardProps) {
  const config = categoryConfigs[category] || { icon: HelpCircle, color: 'from-emerald-500 to-teal-500' };
  const Icon = config.icon;

  return (
    <div
      onClick={() => onSelect(category)}
      id={`category-card-${category.toLowerCase()}`}
      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none active:scale-95 flex items-center gap-4 ${
        isSelected
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
          : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-blue-500/20 dark:hover:border-white/20 hover:shadow-md'
      }`}
    >
      {/* Icon frame with beautiful premium background gradient */}
      <div className={`p-3 rounded-xl shrink-0 ${
        isSelected 
          ? 'bg-white/20 text-white' 
          : `bg-gradient-to-br ${config.color} text-white shadow-sm`
      }`}>
        <Icon className="h-5.5 w-5.5" />
      </div>

      <div className="min-w-0">
        <h4 className="font-bold text-sm md:text-base leading-tight truncate">
          {category}
        </h4>
        <p className={`text-[11px] font-medium mt-0.5 ${
          isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {appCount} Aplikasi
        </p>
      </div>
    </div>
  );
}
