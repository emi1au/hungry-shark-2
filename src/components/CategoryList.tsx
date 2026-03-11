import React from 'react';
import { Category } from '../types';
import { CATEGORY_COLORS, getCategoryColor, getCategoryEmoji } from '../constants';

interface CategoryListProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full pr-2">
      {Object.values(Category).map((category) => {
        const color = getCategoryColor(category);
        const isSelected = selectedCategory === category;
        
        // Map color names to Tailwind classes
        const getColorClass = (colorName: string, selected: boolean) => {
          const baseColors: Record<string, string> = {
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            blue: 'bg-blue-100 text-blue-800 border-blue-200',
            amber: 'bg-amber-100 text-amber-800 border-amber-200',
            rose: 'bg-rose-100 text-rose-800 border-rose-200',
            teal: 'bg-teal-100 text-teal-800 border-teal-200',
            indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            red: 'bg-red-100 text-red-800 border-red-200',
            orange: 'bg-orange-100 text-orange-800 border-orange-200',
            emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            purple: 'bg-purple-100 text-purple-800 border-purple-200',
            lime: 'bg-lime-100 text-lime-800 border-lime-200',
            pink: 'bg-pink-100 text-pink-800 border-pink-200',
            cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            slate: 'bg-slate-100 text-slate-800 border-slate-200',
          };
          
          const selectedColors: Record<string, string> = {
            yellow: 'bg-yellow-500 text-white border-yellow-600',
            blue: 'bg-blue-500 text-white border-blue-600',
            amber: 'bg-amber-500 text-white border-amber-600',
            rose: 'bg-rose-500 text-white border-rose-600',
            teal: 'bg-teal-500 text-white border-teal-600',
            indigo: 'bg-indigo-500 text-white border-indigo-600',
            red: 'bg-red-500 text-white border-red-600',
            orange: 'bg-orange-500 text-white border-orange-600',
            emerald: 'bg-emerald-500 text-white border-emerald-600',
            purple: 'bg-purple-500 text-white border-purple-600',
            lime: 'bg-lime-500 text-white border-lime-600',
            pink: 'bg-pink-500 text-white border-pink-600',
            cyan: 'bg-cyan-500 text-white border-cyan-600',
            slate: 'bg-slate-500 text-white border-slate-600',
          };

          return selected ? (selectedColors[colorName] || selectedColors.slate) : (baseColors[colorName] || baseColors.slate);
        };

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`
              p-4 rounded-xl text-left font-semibold transition-all duration-200 border-2
              ${getColorClass(color, isSelected)}
              ${isSelected ? 'shadow-md scale-[1.02]' : 'hover:bg-opacity-80 hover:scale-[1.01]'}
            `}
          >
            <span className="mr-1.5">{getCategoryEmoji(category)}</span>
            {category}
          </button>
        );
      })}
    </div>
  );
};
