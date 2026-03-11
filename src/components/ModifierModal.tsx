import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, ModifierGroup, ModifierOption } from '../types';
import { DEFAULT_MODIFIER_GROUPS, getModifierGroupIdsForItem, getModifierEmoji, getModifierGroupEmoji, getCategoryEmoji } from '../constants';
import { calculateChipsPrice, getModifierPriority, adjustModifierPrices } from '../utils/modifierUtils';
import { X } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, modifiers: ModifierOption[], quantity: number, instructions?: string) => void;
  initialSelections?: ModifierOption[];
  initialInstructions?: string;
  isEditing?: boolean;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, isOpen, onClose, onAddToCart, initialSelections = [], initialInstructions = '', isEditing = false }) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierOption[]>>({});
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      const initial: Record<string, ModifierOption[]> = {};
      
      if (initialSelections.length > 0) {
        initialSelections.forEach(sel => {
          if (sel.groupId) {
            if (!initial[sel.groupId]) initial[sel.groupId] = [];
            initial[sel.groupId].push(sel);
          }
        });
      } else {
        // Populate defaults if no initial selections
        const baseGroupIds = getModifierGroupIdsForItem(item);
        baseGroupIds.forEach(groupId => {
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          if (group && !group.allowMultiple && group.options.length > 0) {
            initial[group.id] = [{ ...group.options[0], groupId: group.id, groupName: group.name }];
          }
        });
      }
      
      const initialQuantities: Record<string, number> = {};
      if (item.category === 'Drinks' && !isEditing) {
        const baseGroupIds = getModifierGroupIdsForItem(item);
        baseGroupIds.forEach(groupId => {
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          if (group && group.options.length > 0) {
            initialQuantities[`${group.id}||${group.options[0].name}`] = 1;
          }
        });
      }
      
      setSelectedModifiers(initial);
      setOptionQuantities(initialQuantities);
      setQuantity(1);
      setInstructions(initialInstructions);
    }
  }, [isOpen, item, initialSelections, initialInstructions]);

  const visibleGroupIds = useMemo(() => {
    if (!item) return [];
    const baseGroupIds = getModifierGroupIdsForItem(item);
    
    // Iterative approach to handle nested triggers correctly
    // Only selected options in VISIBLE groups should trigger new groups
    let currentGroupIds = [...baseGroupIds];
    const processedGroupIds = new Set<string>();
    const finalGroupIds = new Set<string>(baseGroupIds);

    // We use a queue-based approach
    while (currentGroupIds.length > 0) {
      const groupId = currentGroupIds.shift()!; // BFS
      if (processedGroupIds.has(groupId)) continue;
      processedGroupIds.add(groupId);

      // Get selected options for this group
      const selected = selectedModifiers[groupId];
      if (selected) {
        selected.forEach(opt => {
           if (opt.triggersGroupId) {
             if (!finalGroupIds.has(opt.triggersGroupId)) {
               finalGroupIds.add(opt.triggersGroupId);
               currentGroupIds.push(opt.triggersGroupId);
             }
           }
           if (opt.triggersGroupIds) {
             opt.triggersGroupIds.forEach(id => {
               if (!finalGroupIds.has(id)) {
                 finalGroupIds.add(id);
                 currentGroupIds.push(id);
               }
             });
           }
        });
      }
    }
    
    return Array.from(finalGroupIds);
  }, [item, selectedModifiers]);

  // Auto-select first option for newly visible single-select groups
  useEffect(() => {
    if (!isOpen || !item) return;
    
    setSelectedModifiers(prev => {
      let changed = false;
      const next = { ...prev };
      
      visibleGroupIds.forEach(groupId => {
        const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
        if (group && !group.allowMultiple && group.options.length > 0) {
          if (!next[groupId] || next[groupId].length === 0) {
            next[groupId] = [{ ...group.options[0], groupId: group.id, groupName: group.name }];
            changed = true;
          }
        }
      });
      
      return changed ? next : prev;
    });
  }, [visibleGroupIds, isOpen, item]);

  if (!isOpen || !item) return null;

  const handleOptionToggle = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers(prev => {
      const currentSelection = prev[group.id] || [];
      const isSelected = currentSelection.some(opt => opt.name === option.name);
      
      let newSelection: ModifierOption[];

      const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };

      if (group.allowMultiple) {
        if (isSelected) {
          newSelection = currentSelection.filter(opt => opt.name !== option.name);
        } else {
          if (group.maxSelection && currentSelection.length >= group.maxSelection) {
            return prev; // Max selection reached
          }
          newSelection = [...currentSelection, optionWithGroup];
        }
      } else {
        // Single selection: replace
        newSelection = [optionWithGroup];
      }
      
      return {
        ...prev,
        [group.id]: newSelection
      };
    });
  };

  const calculateTotal = () => {
    if (item.category === 'Drinks' && !isEditing) {
      let total = 0;
      Object.entries(optionQuantities).forEach(([key, qty]) => {
        if (qty > 0) {
          const [groupId, optionName] = key.split('||');
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          const option = group?.options.find(o => o.name === optionName);
          if (option) {
            total += (item.price + option.price) * qty;
          }
        }
      });
      return total;
    }

    const allSelectedOptions: ModifierOption[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, options]) => {
      if (visibleGroupIds.includes(groupId)) {
        allSelectedOptions.push(...options);
      }
    });

    const adjustedOptions = adjustModifierPrices(item.category, allSelectedOptions);

    const customPrice = calculateChipsPrice(item.name, adjustedOptions);
    if (customPrice !== null) {
      return customPrice * quantity;
    }

    let total = item.price;
    adjustedOptions.forEach(opt => {
      total += opt.price;
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    if (item.category === 'Drinks' && !isEditing) {
      let added = false;
      Object.entries(optionQuantities).forEach(([key, qty]) => {
        if (qty > 0) {
          const [groupId, optionName] = key.split('||');
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          const option = group?.options.find(o => o.name === optionName);
          if (group && option) {
            const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
            onAddToCart(item, [optionWithGroup], qty, instructions.trim() || undefined);
            added = true;
          }
        }
      });
      if (added) {
        onClose();
      }
      return;
    }

    const allModifiers: ModifierOption[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, options]) => {
      if (visibleGroupIds.includes(groupId)) {
        allModifiers.push(...options);
      }
    });
    
    const adjustedOptions = adjustModifierPrices(item.category, allModifiers);
    
    onAddToCart(item, adjustedOptions, quantity, instructions.trim() || undefined);
    onClose();
  };

  // Filter groups to show only visible ones
  const visibleGroups = DEFAULT_MODIFIER_GROUPS
    .filter(g => visibleGroupIds.includes(g.id))
    .sort((a, b) => getModifierPriority(a.id) - getModifierPriority(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              <span className="mr-2">{getCategoryEmoji(item.category)}</span>
              {item.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {visibleGroups.map(group => (
            <div key={group.id} className="space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xs font-semibold text-slate-500">
                  <span className="mr-1.5">{getModifierGroupEmoji(group.name)}</span>
                  {group.name}
                </h3>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {item.category === 'Drinks' && !isEditing ? 'Multiple' : (group.allowMultiple ? (group.maxSelection ? `Max ${group.maxSelection}` : 'Multiple') : 'Select One')}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {group.options.map((option, idx) => {
                  const isDrinksMulti = item.category === 'Drinks' && !isEditing;
                  const optionKey = `${group.id}||${option.name}`;
                  const optionQty = optionQuantities[optionKey] || 0;
                  const isSelected = isDrinksMulti ? optionQty > 0 : selectedModifiers[group.id]?.some(opt => opt.name === option.name);
                  
                  return (
                    <div
                      key={`${group.id}-${idx}`}
                      onClick={() => {
                        if (isDrinksMulti) {
                          setOptionQuantities(prev => ({ ...prev, [optionKey]: (prev[optionKey] || 0) + 1 }));
                        } else {
                          handleOptionToggle(group, option);
                        }
                      }}
                      className={`
                        flex flex-col justify-between p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer relative
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-slate-300 hover:border-blue-200 hover:bg-slate-50'}
                      `}
                    >
                      <div className="flex justify-between items-start w-full mb-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                          <span className="mr-1.5">{getModifierEmoji(option.name)}</span>
                          {option.name}
                        </span>
                        {option.price > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                            +£{option.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {isDrinksMulti && isSelected && (
                        <div className="flex items-center justify-between w-full mt-auto bg-white rounded-lg border border-blue-200 p-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOptionQuantities(prev => ({ ...prev, [optionKey]: Math.max(0, (prev[optionKey] || 0) - 1) }));
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-blue-700">{optionQty}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOptionQuantities(prev => ({ ...prev, [optionKey]: (prev[optionKey] || 0) + 1 }));
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500">Special Instructions</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add any special requests (optional)..."
              className="w-full border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
          {!(item.category === 'Drinks' && !isEditing) && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 text-slate-500 hover:text-blue-600 font-bold text-xl w-10"
              >
                -
              </button>
              <span className="font-mono font-bold text-lg w-8 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 text-slate-500 hover:text-blue-600 font-bold text-xl w-10"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-between items-center"
          >
            <span>{item.category === 'Drinks' && !isEditing ? 'Add Drinks to Order' : 'Add to Order'}</span>
            <span className="bg-blue-800/30 px-3 py-1 rounded-lg">
              £{calculateTotal().toFixed(2)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
