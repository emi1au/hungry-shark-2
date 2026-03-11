
import React, { useMemo, useState } from 'react';
import { MenuItem, Category, ModifierGroup, ModifierOption } from '../types';
import { CURRENCY, getCategoryColor, getCategoryEmoji, getModifierEmoji, getModifierGroupEmoji } from '../constants';
import { adjustModifierPrices } from '../utils/modifierUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const getBgColorClass = (colorName: string) => {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-100 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    blue: 'bg-blue-100 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    amber: 'bg-amber-100 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    rose: 'bg-rose-100 hover:bg-rose-100 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    teal: 'bg-teal-100 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
    indigo: 'bg-indigo-100 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
    red: 'bg-red-100 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    orange: 'bg-orange-100 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    emerald: 'bg-emerald-100 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    purple: 'bg-purple-100 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    lime: 'bg-lime-100 hover:bg-lime-100 border-lime-200 dark:bg-lime-900/20 dark:border-lime-800',
    pink: 'bg-pink-100 hover:bg-pink-100 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800',
    cyan: 'bg-cyan-100 hover:bg-cyan-100 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800',
    slate: 'bg-slate-100 hover:bg-slate-100 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800',
  };
  return colors[colorName] || colors.slate;
};

export interface MenuGridProps {
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
  onAddToOrder: (item: MenuItem, modifiers: ModifierOption[], quantity: number) => void;
  onOpenModal: (item: MenuItem, currentModifiers: ModifierOption[]) => void;
  groupByCategory?: boolean;
  viewMode?: 'detailed' | 'compact';
}

// IDs of groups that are candidates for inline display
const INLINE_GROUP_IDS = [
  'size_fish', 
  'size_burger', 
  'size_kebab', 
  'size_chips', 
  'chip_combo_selection', 
  'size_combo_ml', 
  'specialty_curry_type', 
  'size_side',
  'size_sausage_plain', 
  'size_sausage_battered',
  'cod_bites_size',
  'fish_chip_opt_med', 
  'fish_chip_opt_lrg', 
  'fish_chip_opt', 
  'chips_cod_bites', 
  'chips_fish_cake', 
  'pie_chips_opt', 
  'opt_chips_sausage_small', 
  'opt_chips_sausage_large', 
  'opt_chips_battered_small', 
  'opt_chips_battered_large', 
  'kebab_base',
  'meal_upgrade',
  'wrap_meal_upgrade', 
  'meal_drinks', 
  'pie_addons',
  'salad', 
  'sauce', 
  'sauce_pot_type', 
  'sauce_pot_size_upgrade', 
  'side_add_chips', 
  'chicken_breast_chips', 
  'chicken_curry_style', 
  'kids_drink_select', 
  'kids_sausage_type', 
  'kids_sauce_choice', 
  'chips_sauce', 
  'condiments', 
  'all_drinks_opt', 
  'dip_flavours'
];

const MenuCard: React.FC<{
  item: MenuItem;
  allGroups: ModifierGroup[];
  onAdd: (item: MenuItem, modifiers: ModifierOption[], quantity: number) => void;
  onCustomize: (item: MenuItem, modifiers: ModifierOption[]) => void;
  viewMode: 'detailed' | 'compact';
}> = ({ item, allGroups = [], onAdd, onCustomize, viewMode }) => {
  const quantity = 1;
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize selections lazily
  const [selections, setSelections] = useState<ModifierOption[]>(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];

    const defaults: ModifierOption[] = [];
    const itemGroups = (item.modifierGroupIds || [])
      .map(id => allGroups.find(g => g.id === id))
      .filter(Boolean) as ModifierGroup[];

    itemGroups.forEach((g) => {
      // Auto-select defaults if single select and has options
      if (!g.allowMultiple && g.options.length > 0) {
         // Default logic: Select first if it's free
         if (g.options[0].price === 0) {
             defaults.push({ ...g.options[0], groupId: g.id, groupName: g.name });
         }
      }
    });
    return defaults;
  });

  // Identify Direct Groups
  const directGroups = useMemo(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];
    return (item.modifierGroupIds || [])
      .map(id => allGroups.find(g => g.id === id))
      .filter(Boolean) as ModifierGroup[];
  }, [item, allGroups]);

  // Calculate Visible Groups using Tree Traversal
  const visibleGroups = useMemo(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];
    
    const visibleSet = new Set<string>(directGroups.map(g => g.id));
    const queue = [...directGroups];
    const result = [...directGroups];

    let head = 0;
    while(head < queue.length){
       const currentGroup = queue[head++];
       const activeOptions = selections.filter(s => s.groupId === currentGroup.id);
       
       activeOptions.forEach(opt => {
           const triggers = [];
           if(opt.triggersGroupId) triggers.push(opt.triggersGroupId);
           if(opt.triggersGroupIds) triggers.push(...opt.triggersGroupIds);
           
           triggers.forEach(tId => {
               if(!visibleSet.has(tId)){
                   const group = allGroups.find(g => g.id === tId);
                   if(group){
                       visibleSet.add(tId);
                       queue.push(group);
                       result.push(group);
                   }
               }
           });
       });
    }
    return result;
  }, [directGroups, selections, allGroups]);

  // Filter selections
  const effectiveSelections = useMemo(() => {
     const visibleIds = new Set(visibleGroups.map(g => g.id));
     const filtered = selections.filter(s => s.groupId && visibleIds.has(s.groupId));
     return adjustModifierPrices(item.category, filtered);
  }, [selections, visibleGroups, item.category]);

  // Filter for Inline Display based on predefined list
  const inlineGroups = useMemo(() => 
    visibleGroups.filter(g => INLINE_GROUP_IDS.includes(g.id)),
  [visibleGroups]);

  // PRIORITIZE SIZE GROUPS for the top inline row
  const topRowGroup = useMemo(() => {
      return inlineGroups.find(g => 
          g.name.toLowerCase().includes('size') || 
          g.name.toLowerCase().includes('portion') || 
          g.name.toLowerCase().includes('how many') ||
          g.id.includes('size')
      ) || null;
  }, [inlineGroups]);

  const topRowOptions = topRowGroup ? topRowGroup.options.slice(0, 3) : [];

  const collapsibleGroups = useMemo(() => {
      return visibleGroups.filter(g => g.id !== topRowGroup?.id);
  }, [visibleGroups, topRowGroup]);

  const showChevron = collapsibleGroups.length > 0;

  const handleSelection = (group: ModifierGroup, option: ModifierOption) => {
    let newSelections = [...selections];
    const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
    
    if (!group.allowMultiple) {
      newSelections = newSelections.filter(s => s.groupId !== group.id && !group.options.find(o => o.name === s.name));
      newSelections.push(optionWithGroup);
    } else {
      const exists = newSelections.find(s => s.name === option.name);
      if (exists) {
        newSelections = newSelections.filter(s => s.name !== option.name);
      } else {
        newSelections.push(optionWithGroup);
      }
    }

    // Handle Triggers
    const getTriggered = (opts: ModifierOption[]) => {
        const ids = new Set<string>();
        opts.forEach(s => {
            if (s.triggersGroupId) ids.add(s.triggersGroupId);
            if (s.triggersGroupIds) s.triggersGroupIds.forEach(id => ids.add(id));
        });
        return ids;
    };

    const prevTriggered = getTriggered(selections);
    const nextTriggered = getTriggered(newSelections);
    const newGroupIds = [...nextTriggered].filter(id => !prevTriggered.has(id));
    const hiddenGroupIds = [...prevTriggered].filter(id => !nextTriggered.has(id));

    if (allGroups && Array.isArray(allGroups)) {
      const hiddenSelections = selections.filter(s => s.groupId && hiddenGroupIds.includes(s.groupId));
      newGroupIds.forEach(gid => {
          const g = allGroups.find(gr => gr.id === gid);
          if (!g) return;
          let carriedOver = false;
          if (hiddenSelections.length > 0) {
              for (const hiddenSel of hiddenSelections) {
                  const match = g.options.find(o => o.name === hiddenSel.name);
                  if (match) {
                      const exists = newSelections.some(s => s.groupId === gid && s.name === match.name);
                      if (!exists) newSelections.push({ ...match, groupId: gid, groupName: g.name });
                      carriedOver = true;
                      if (!g.allowMultiple) break; 
                  }
              }
          }
          if (!carriedOver && !g.allowMultiple && g.options.length > 0) {
              const alreadyHas = newSelections.some(s => g.options.some(o => o.name === s.name));
              if (!alreadyHas) newSelections.push({ ...g.options[0], groupId: g.id, groupName: g.name });
          }
      });
    }
    setSelections(newSelections);
  };

  const currentPrice = item.price + effectiveSelections.reduce((acc, curr) => acc + curr.price, 0);
  const colorName = getCategoryColor(item.category);

  // --- RENDER LOGIC ---

  // 1. COMPACT TILE GRID VIEW (5x4 Style)
  if (viewMode === 'compact') {
    const colorName = getCategoryColor(item.category);
    
    // Determine TV indicator based on category
    const getTvForCategory = (cat: Category) => {
      if ([Category.FISH, Category.PIES, Category.SAUSAGES].includes(cat)) return 'TV1';
      if ([Category.CHIPS, Category.KIDS_MEALS, Category.POTS].includes(cat)) return 'TV2';
      if ([Category.BURGERS, Category.WRAPS, Category.KEBABS].includes(cat)) return 'TV3';
      if ([Category.CHICKEN, Category.BITES, Category.SIDES, Category.DRINKS].includes(cat)) return 'TV4';
      return 'TV1';
    };

    return (
      <div 
        onClick={() => onCustomize(item, effectiveSelections)}
        className={`
          aspect-[5/2] flex flex-col justify-between p-3 rounded-xl shadow-sm border cursor-pointer transition-transform active:scale-[0.98] group overflow-hidden relative ${getBgColorClass(colorName)}
        `}
      >
         {/* Top Row: Name */}
         <div className="z-10 pr-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight break-words">
              <span className="mr-1">{getCategoryEmoji(item.category)}</span>
              {item.name}
            </h3>
         </div>

      </div>
    );
  }

  // 2. DETAILED CARD VIEW
  return (
    <div 
      className={`rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${getBgColorClass(colorName)} ${isExpanded ? 'ring-2 ring-slate-400 dark:ring-slate-600 shadow-md' : ''}`}
    >
      {/* Header Row - Flexible Layout */}
      <div className="flex flex-col min-h-[90px] p-4 gap-4">
        
        {/* Left Area: Name & Price -> Opens Modal */}
        <div 
          className="flex-1 flex flex-col justify-center cursor-pointer hover:opacity-70 transition-opacity group min-w-[140px]"
          onClick={() => onCustomize(item, effectiveSelections)}
          title="Click to Customize"
        >
           <h3 className="font-extrabold text-slate-900 dark:text-white leading-none mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
             <span className="mr-1.5">{getCategoryEmoji(item.category)}</span>
             {item.name}
           </h3>
           <p className="text-sm text-slate-400 font-bold">{CURRENCY}{item.price.toFixed(2)} Base</p>
        </div>

        {/* Center Area: Primary Inline Group (Sizes ONLY) */}
        {topRowGroup && (
           <div className="flex-1 flex flex-wrap gap-2 items-center justify-start">
              {topRowOptions.map(opt => {
                const isSelected = selections.some(s => s.name === opt.name);
                const isActiveColor = 'yellow';

                return (
                  <button
                    key={opt.name}
                    onClick={(e) => { e.stopPropagation(); handleSelection(topRowGroup, opt); }}
                    className={`text-sm px-4 py-2.5 rounded-lg font-bold transition-all border shadow-sm flex-grow md:flex-grow-0 text-center ${
                      isSelected 
                        ? `bg-${isActiveColor}-500 text-white border-${isActiveColor}-600 ring-2 ring-${isActiveColor}-200 dark:ring-${isActiveColor}-900 transform scale-105` 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="mr-1.5">{getModifierEmoji(opt.name)}</span>
                    {opt.name}
                    {opt.price > 0 && <span className="ml-1 opacity-80 text-xs font-normal">+{CURRENCY}{opt.price.toFixed(2)}</span>}
                  </button>
                );
              })}
           </div>
        )}

        {/* Right Area: Actions */}
        <div className="flex items-center gap-3 shrink-0 justify-between mt-2 md:mt-0">
           
           {/* Add Button */}
           <button
             onClick={(e) => {
               e.stopPropagation();
               onAdd(item, effectiveSelections, quantity);
             }}
             className="bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white pl-5 pr-4 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-3 group whitespace-nowrap"
           >
             <span>Add</span>
             <span className="bg-slate-700 dark:bg-slate-900 group-hover:bg-slate-600 px-2 py-0.5 rounded text-sm text-slate-200 font-mono">
               {CURRENCY}{currentPrice.toFixed(2)}
             </span>
           </button>
           
           {/* Expand/Collapse Chevron */}
           {showChevron && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsExpanded(!isExpanded);
               }} 
               className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : ''}`}
               title={isExpanded ? "Collapse Options" : "Show Options"}
             >
               {isExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
             </button>
           )}
        </div>
      </div>

      {/* Expanded Dashboard Body */}
      {isExpanded && showChevron && (
        <div className="px-5 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200 bg-white dark:bg-slate-900">
          <div className="flex flex-row flex-wrap gap-8">
            {collapsibleGroups.map(group => (
              <div key={group.id} className="flex-1 min-w-[180px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span className="mr-1">{getModifierGroupEmoji(group.name)}</span>
                  {group.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(opt => {
                    const isSelected = selections.some(s => s.name === opt.name);
                    
                    return (
                      <button
                        key={opt.name}
                        onClick={(e) => { e.stopPropagation(); handleSelection(group, opt); }}
                        className={`text-sm px-5 py-3 rounded-lg font-bold transition-all border shadow-sm text-center flex-grow md:flex-grow-0 ${
                          isSelected 
                            ? `bg-${colorName}-500 text-white border-${colorName}-600 ring-2 ring-${colorName}-200 dark:ring-${colorName}-900` 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="mr-1.5">{getModifierEmoji(opt.name)}</span>
                        {opt.name}
                        {opt.price > 0 && <span className="ml-1 opacity-80 text-xs font-normal">+{CURRENCY}{opt.price.toFixed(2)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MenuGrid: React.FC<MenuGridProps> = ({ 
  items, 
  modifierGroups, 
  onAddToOrder, 
  onOpenModal, 
  groupByCategory = false,
  viewMode = 'detailed' 
}) => {
  
  const groupedItems = useMemo<Record<string, MenuItem[]>>(() => {
    // If grouping is requested AND we are in detailed mode
    if (groupByCategory && viewMode === 'detailed') {
        const groups: Record<string, MenuItem[]> = {};
        const categoriesPresent = new Set(items.map(i => i.category));
        Object.values(Category).forEach(cat => {
          if (categoriesPresent.has(cat)) {
            const catItems = items.filter(i => i.category === cat);
            groups[cat] = catItems;
          }
        });
        return groups;
    }
    return { 'All': items };
  }, [items, groupByCategory, viewMode]);

  return (
    <div className="h-full overflow-y-auto pb-32 p-2 md:p-4 space-y-8 custom-scrollbar">
      {(Object.entries(groupedItems) as [string, MenuItem[]][]).map(([categoryName, categoryItems]) => {
        // Only show headers in detailed mode when grouped
        const showHeader = viewMode === 'detailed' && categoryName !== 'All';
        const catColor = categoryName !== 'All' ? getCategoryColor(categoryName as Category) : 'slate';

        // Map colors for header text to match tile theme loosely
        let headerClass = `text-${catColor}-600`;
        if (catColor === 'amber') headerClass = 'text-amber-600';
        if (catColor === 'rose') headerClass = 'text-rose-700';

        return (
          <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {showHeader && (
              <div className="flex items-center gap-4 mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                <h3 className={`text-xl font-black uppercase tracking-widest ${headerClass} dark:text-white`}>
                  {categoryName}
                </h3>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                  {categoryItems.length}
                </span>
              </div>
            )}
            
            <div className={viewMode === 'detailed' 
              ? "grid grid-cols-3 gap-4" 
              : "grid grid-cols-5 gap-4"
            }>
              {categoryItems.map((item) => (
                <MenuCard 
                  key={item.id} 
                  item={item} 
                  allGroups={modifierGroups}
                  onAdd={onAddToOrder}
                  onCustomize={onOpenModal}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuGrid;
