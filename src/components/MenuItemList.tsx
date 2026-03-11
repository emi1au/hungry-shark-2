import React from 'react';
import { MenuItem } from '../types';
import { getCategoryEmoji } from '../constants';
import { MENU_ITEMS } from '../constants';

interface MenuItemListProps {
  category: string;
  onItemClick: (item: MenuItem) => void;
}

export const MenuItemList: React.FC<MenuItemListProps> = ({ category, onItemClick }) => {
  const items = MENU_ITEMS.filter(item => item.category === category);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto h-full">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item)}
          className="
            flex flex-col justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200
            hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200
            min-h-[120px] text-left group
          "
        >
          <div>
            <h3 className="font-bold text-slate-800 group-hover:text-blue-700 text-lg leading-tight mb-1">
              <span className="mr-1.5">{getCategoryEmoji(item.category)}</span>
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                {item.description}
              </p>
            )}
          </div>
          <div className="mt-auto pt-2 border-t border-slate-100 w-full flex justify-between items-center">
            <span className="font-mono font-medium text-slate-600 group-hover:text-blue-600">
              £{item.price.toFixed(2)}
            </span>
            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600">
              Add
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
