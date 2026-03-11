
import React, { useState, useMemo } from 'react';
import { CartItem, ModifierOption, Category, CustomerDetails, OrderType } from '../types';
import { isInlineModifier, getModifierPriority, getModifierSuperGroup } from '../utils/modifierUtils';
import { getCategoryEmoji, getModifierEmoji } from '../constants';

import { Printer, X, FileText, Copy, CheckCircle2 } from 'lucide-react';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  orderNumber: number;
  date: Date;
  onClose: () => void;
  isOpen: boolean;
  paymentInfo?: {
    method: 'Cash' | 'Card';
    tendered?: number;
    change?: number;
  };
  onReprint?: (copies?: number) => void;
  customer?: CustomerDetails;
  orderType?: OrderType;
}

// Define specific order for receipt categories
const CATEGORY_PRIORITY = [
  Category.CHIPS,
  Category.FISH,
  Category.PIES,
  Category.SAUSAGES,
  Category.CHICKEN,
  Category.BITES,
  Category.KEBABS,
  Category.BURGERS,
  Category.WRAPS,
  Category.KIDS_MEALS,
  Category.POTS,
  Category.SIDES,
  Category.DRINKS
];



export const Receipt: React.FC<ReceiptProps> = ({ 
  items, 
  total, 
  orderNumber, 
  date, 
  onClose, 
  isOpen, 
  onReprint,
  customer,
  orderType
}) => {
  const [paperWidth, setPaperWidth] = useState<'57mm' | '80mm'>('80mm');
  const [doublePrint, setDoublePrint] = useState(false);

  // Sort by Category
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const catA = CATEGORY_PRIORITY.indexOf(a.category);
      const catB = CATEGORY_PRIORITY.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  // Group by category
  const itemsByCategory = useMemo(() => {
      const groups: Record<string, CartItem[]> = {};
      sortedItems.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [sortedItems]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const copies = doublePrint ? 2 : 1;
    if (onReprint) {
      onReprint(copies);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <style>{`
        @media print {
          body > *:not(.receipt-print-container) {
            display: none !important;
          }
          .receipt-print-container {
            display: flex !important;
            justify-content: center;
            align-items: flex-start;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            background: white;
            z-index: 9999;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: auto; 
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="receipt-print-container bg-white md:rounded-xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] w-full md:w-auto">
        
        {/* Screen Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print shrink-0">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              <h2 className="font-bold">Receipt Preview</h2>
            </div>
            
            <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-medium">
               <button 
                 onClick={() => setPaperWidth('57mm')}
                 className={`px-3 py-1.5 rounded-md transition-all ${paperWidth === '57mm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 57mm
               </button>
               <button 
                 onClick={() => setPaperWidth('80mm')}
                 className={`px-3 py-1.5 rounded-md transition-all ${paperWidth === '80mm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 80mm
               </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-8 bg-slate-100 flex justify-center flex-1">
           {/* Receipt Paper */}
           <div 
             className="bg-white shadow-xl p-6 text-black"
             style={{ 
               width: paperWidth === '57mm' ? '58mm' : '80mm',
               minHeight: '100mm',
               fontFamily: 'Arial, Helvetica, sans-serif',
               lineHeight: '1.5',
             }}
           >
              {/* Header Line */}
              <div className="flex justify-between items-end text-[13px] mb-2">
                <span>Hungry Shark</span>
                <span>Time: {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
              </div>

              {/* Black Line Separator */}
              <div className="border-b border-black mb-4"></div>

              {/* Order Number */}
              <div className="text-center mb-4">
                <div className="text-[13px] font-medium mb-1 uppercase">ORDER NUMBER:</div>
                <div className="text-[42px] font-bold leading-none tracking-tight">B{orderNumber}</div>
              </div>

              {/* Black Line Separator */}
              <div className="border-b border-black mb-4"></div>

              {/* Delivery Info */}
              {orderType === 'Delivery' && customer && (
                  <div className="mb-4">
                      <p className="uppercase mb-2 text-[11px] tracking-wider">CUSTOMER INFO:</p>
                      <p className="text-[15px] font-bold mb-1">{customer.phone}</p>
                      <p className="text-[15px]">{customer.address}</p>
                      <p className="text-[15px]">{customer.postcode}</p>
                      <div className="border-b border-black mt-4 mb-4"></div>
                  </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                {CATEGORY_PRIORITY.map((cat) => {
                    const catItems = itemsByCategory[cat];
                    if (!catItems || catItems.length === 0) return null;

                    // DRINKS: Special Grouping
                    if (cat === Category.DRINKS) {
                        const groupedDrinks: Record<string, CartItem[]> = {};
                        catItems.forEach(item => {
                            if (!groupedDrinks[item.id]) groupedDrinks[item.id] = [];
                            groupedDrinks[item.id].push(item);
                        });

                        return (
                            <div key={cat} className="mb-4">
                                <div className="text-[11px] uppercase tracking-wider mb-2">{cat}</div>
                                <div className="space-y-2">
                                    {Object.values(groupedDrinks).map((group, gIdx) => {
                                        const firstItem = group[0];
                                        const hasVariants = group.some(i => i.modifiers.length > 0);

                                        if (hasVariants) {
                                            return (
                                                <div key={`g-${gIdx}`} className={gIdx < Object.values(groupedDrinks).length - 1 ? "mb-4" : ""}>
                                                    <div className="text-[15px] mb-1">
                                                        <span className="mr-1.5">{getCategoryEmoji(firstItem.category)}</span>
                                                        {firstItem.name}
                                                    </div>
                                                    {group.map((item, iIdx) => {
                                                        const itemTotal = (item.manualPrice !== undefined ? item.manualPrice : (item.price + item.modifiers.reduce((s, m) => s + m.price, 0))) * item.quantity;
                                                        const flavorText = item.modifiers.map(m => `(${getModifierEmoji(m.name)} ${m.name})`).join(' ');
                                                        return (
                                                            <div key={`i-${iIdx}`} className={iIdx < group.length - 1 ? "mb-4" : ""}>
                                                                <div className="flex justify-between items-start text-[15px] leading-relaxed pl-2">
                                                                    <span className="font-bold pr-2">{item.quantity} x {flavorText}</span>
                                                                    <span className="font-normal">{itemTotal.toFixed(2)}</span>
                                                                </div>
                                                                {item.instructions && (
                                                                    <div className="text-[12px] leading-relaxed text-slate-700 pl-4 mt-0.5 italic">
                                                                        Note: {item.instructions}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            // Standard item like Water
                                            return group.map((item, iIdx) => {
                                                const itemTotal = (item.manualPrice !== undefined ? item.manualPrice : (item.price + item.modifiers.reduce((s, m) => s + m.price, 0))) * item.quantity;
                                                return (
                                                    <div key={`i-${iIdx}`} className={iIdx < group.length - 1 || gIdx < Object.values(groupedDrinks).length - 1 ? "mb-4" : ""}>
                                                        <div className="flex justify-between items-start text-[15px] leading-relaxed">
                                                            <span className="font-bold pr-2">{item.quantity} x {getCategoryEmoji(item.category)} {item.name}</span>
                                                            <span className="font-normal">{itemTotal.toFixed(2)}</span>
                                                        </div>
                                                        {item.instructions && (
                                                            <div className="text-[12px] leading-relaxed text-slate-700 pl-2 mt-0.5 italic">
                                                                Note: {item.instructions}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        }
                                    })}
                                </div>
                                <div className="border-b border-black mt-2"></div>
                            </div>
                        );
                    }

                    // STANDARD ITEMS
                    return (
                        <div key={cat} className="mb-4">
                            {/* Category Header */}
                            <div className="text-[11px] uppercase tracking-wider mb-2">{cat}</div>
                            
                            <div>
                            {catItems.map((item, iIdx) => {
                                let itemTotal = 0;
                                if (item.manualPrice !== undefined) {
                                    itemTotal = item.manualPrice * item.quantity;
                                } else {
                                    const modsCost = item.modifiers.reduce((s, m) => s + m.price, 0);
                                    itemTotal = (item.price + modsCost) * item.quantity;
                                }
                                
                                const sizeModifiers = item.modifiers.filter(m => isInlineModifier(m.groupId));
                                const otherModifiers = item.modifiers.filter(m => !isInlineModifier(m.groupId));
                                
                                const sizeText = sizeModifiers.map(m => `(${getModifierEmoji(m.name)} ${m.name})`).join(' ');
                                const fullName = sizeText ? `${getCategoryEmoji(item.category)} ${item.name} ${sizeText}` : `${getCategoryEmoji(item.category)} ${item.name}`;
                                
                                // Sort modifiers
                                otherModifiers.sort((a, b) => getModifierPriority(a.groupId) - getModifierPriority(b.groupId));

                                // Group modifiers
                                const groupedModifiers = new Map<string, ModifierOption[]>();
                                otherModifiers.forEach(m => {
                                    const key = getModifierSuperGroup(m.groupId);
                                    if(!groupedModifiers.has(key)) groupedModifiers.set(key, []);
                                    groupedModifiers.get(key)?.push(m);
                                });
                                
                                const modifierGroups = Array.from(groupedModifiers.values());

                                return (
                                    <div key={`i-${iIdx}`} className={iIdx < catItems.length - 1 ? "mb-4" : ""}>
                                        <div className="flex justify-between items-start text-[15px] leading-relaxed mb-1">
                                            <span className="font-bold pr-2">{item.quantity} x {fullName}</span>
                                            <span className="font-normal">{itemTotal.toFixed(2)}</span>
                                        </div>
                                        {otherModifiers.length > 0 && (
                                            <div className="leading-relaxed text-slate-700 pl-2">
                                                {modifierGroups.map((mods, mIdx) => {
                                                    const isCondiment = mods.some(m => getModifierSuperGroup(m.groupId) === 'condiments');
                                                    return (
                                                        <div key={mIdx} className={`mb-0.5 ${isCondiment ? 'text-[10px]' : 'text-[13px]'}`}>
                                                            + ({mods.map(m => `${getModifierEmoji(m.name)} ${m.name}`).join(', ')})
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {item.instructions && (
                                            <div className="text-[12px] leading-relaxed text-slate-700 pl-2 mt-0.5 italic">
                                                Note: {item.instructions}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            </div>
                            <div className="border-b border-black mt-2"></div>
                        </div>
                    );
                })}
              </div>

              {/* Total Section */}
              <div className="flex justify-between items-end mt-4">
                 <span className="text-[11px] uppercase tracking-wider">TOTAL</span>
                 <span className="text-[16px]">{total.toFixed(2)}</span>
              </div>

           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center gap-3 no-print shrink-0">
          <button
            onClick={() => setDoublePrint(!doublePrint)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${doublePrint ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {doublePrint ? <CheckCircle2 size={20} className="text-blue-600" /> : <Copy size={20} />}
            {doublePrint ? 'Double Print (x2)' : 'Single Print'}
          </button>

          <div className="flex gap-3">
            <button 
                onClick={onClose} 
                className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
                Done
            </button>
            <button 
                onClick={handlePrint} 
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
            >
                <Printer size={20} />
                {onReprint ? `Print (${doublePrint ? 'x2' : 'x1'})` : 'Print'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

