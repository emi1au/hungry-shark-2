
import React, { useState } from 'react';
import { ModifierGroup, ModifierOption, MenuItem, Category } from '../types';
import { CURRENCY, getCategoryEmoji, getModifierGroupEmoji, getModifierEmoji } from '../constants';
import { X, Plus, Trash2, Edit2, Package, Layers, Link2, AlertTriangle, RefreshCcw } from 'lucide-react';

interface MenuManagerProps {
  isOpen: boolean;
  onClose: () => void;
  modifierGroups: ModifierGroup[];
  onUpdateModifierGroup: (updatedGroup: ModifierGroup) => void;
  menuItems: MenuItem[];
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onAddMenuItem?: (newItem: MenuItem) => void;
  onDeleteMenuItem?: (itemId: string) => void;
  onResetMenu: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ 
  isOpen, 
  onClose, 
  modifierGroups, 
  onUpdateModifierGroup,
  menuItems,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  onResetMenu
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'modifiers'>('products');
  
  // Modifier State
  const [selectedGroupId, setSelectedGroupId] = useState<string>(modifierGroups[0]?.id || '');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');
  const [newOptionTriggerId, setNewOptionTriggerId] = useState(''); 

  // Product State
  const [selectedProductId, setSelectedProductId] = useState<string>(menuItems[0]?.id || '');
  
  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  // -- Modifiers Logic --
  const activeGroup = modifierGroups.find(g => g.id === selectedGroupId);

  const handleAddOption = () => {
    if (!activeGroup || !newOptionName.trim()) return;
    const price = parseFloat(newOptionPrice) || 0;
    const newOption: ModifierOption = { 
      name: newOptionName, 
      price,
      triggersGroupId: newOptionTriggerId || undefined 
    };
    onUpdateModifierGroup({
      ...activeGroup,
      options: [...activeGroup.options, newOption]
    });
    setNewOptionName('');
    setNewOptionPrice('');
    setNewOptionTriggerId('');
  };

  const handleDeleteOption = (index: number) => {
    if (!activeGroup) return;
    const updatedOptions = [...activeGroup.options];
    updatedOptions.splice(index, 1);
    onUpdateModifierGroup({
      ...activeGroup,
      options: updatedOptions
    });
  };

  const handleEditOptionPrice = (index: number, newPrice: number) => {
      if (!activeGroup) return;
      const updatedOptions = [...activeGroup.options];
      updatedOptions[index] = { ...updatedOptions[index], price: newPrice };
      onUpdateModifierGroup({ ...activeGroup, options: updatedOptions });
  };

  // -- Products Logic --
  const activeProduct = menuItems.find(p => p.id === selectedProductId);

  const handleUpdateProductField = (field: keyof MenuItem, value: any) => {
    if (!activeProduct) return;
    onUpdateMenuItem({
      ...activeProduct,
      [field]: value
    });
  };

  const toggleModifierGroupForProduct = (groupId: string) => {
    if (!activeProduct) return;
    const currentIds = activeProduct.modifierGroupIds || [];
    const newIds = currentIds.includes(groupId) 
      ? currentIds.filter(id => id !== groupId)
      : [...currentIds, groupId];
    
    onUpdateMenuItem({
      ...activeProduct,
      modifierGroupIds: newIds
    });
  };

  const handleAddProduct = () => {
    if (onAddMenuItem) {
      const newId = `new-${Date.now()}`;
      onAddMenuItem({
        id: newId,
        name: 'New Product',
        price: 0,
        category: Category.SIDES,
        modifierGroupIds: [],
        image: 'https://picsum.photos/seed/new/400/300'
      });
      setSelectedProductId(newId);
    }
  };

  const initiateDeleteProduct = () => {
    if (!activeProduct) return;
    setProductToDelete(activeProduct);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete && onDeleteMenuItem) {
      onDeleteMenuItem(productToDelete.id);
      setProductToDelete(null);
      setSelectedProductId('');
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all custom menu changes and restore the Barry Island defaults.")) {
      onResetMenu();
      alert("Menu reset to defaults!");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-black text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg shadow-emerald-900/20">
               <Edit2 size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold">Menu Manager</h2>
               <p className="text-slate-400 text-sm">Edit Products & Modifiers</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleReset}
              className="bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-red-500/20 hover:border-red-600"
            >
              <RefreshCcw size={14} /> Reset Defaults
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-white dark:bg-slate-900 border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Package size={18} />
            Products & Prices
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('modifiers')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'modifiers' ? 'bg-white dark:bg-slate-900 border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Layers size={18} />
            Modifiers / Options
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
          
          {/* --- PRODUCTS TAB --- */}
          {activeTab === 'products' && (
            <>
              {/* Sidebar - Product List */}
              <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 flex flex-col">
                 <div className="flex-1 space-y-6">
                    {/* Group by Category */}
                    {Object.values(Category).map(category => {
                      const itemsInCat = menuItems.filter(i => i.category === category);
                      if (itemsInCat.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{category}</h3>
                          <div className="space-y-1">
                            {itemsInCat.map(item => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedProductId(item.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between ${
                                  selectedProductId === item.id 
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent'
                                }`}
                              >
                                <span className="truncate">
                                  <span className="mr-1.5">{getCategoryEmoji(item.category)}</span>
                                  {item.name}
                                </span>
                                <span className="opacity-60">{CURRENCY}{item.price.toFixed(2)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                 </div>
                 <div className="pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-slate-50 dark:bg-slate-900">
                   <button 
                     type="button"
                     onClick={handleAddProduct}
                     className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
                   >
                     <Plus size={18} /> Add New Product
                   </button>
                 </div>
              </div>

              {/* Main - Product Editor */}
              <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900">
                {activeProduct ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Edit Product</h3>
                      <button 
                        type="button"
                        onClick={initiateDeleteProduct}
                        className="text-red-500 hover:text-white border border-red-200 dark:border-red-900/30 hover:bg-red-600 p-2.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors bg-red-50 dark:bg-red-900/10"
                      >
                         <Trash2 size={18} /> Delete Product
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Item Name</label>
                         <input 
                           type="text" 
                           value={activeProduct.name}
                           onChange={(e) => handleUpdateProductField('name', e.target.value)}
                           className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-slate-900 dark:text-white transition-all"
                         />
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Price ({CURRENCY})</label>
                         <input 
                           type="number" 
                           step="0.01"
                           value={activeProduct.price}
                           onChange={(e) => handleUpdateProductField('price', parseFloat(e.target.value))}
                           className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-slate-900 dark:text-white transition-all"
                         />
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Category</label>
                         <select 
                           value={activeProduct.category}
                           onChange={(e) => handleUpdateProductField('category', e.target.value)}
                           className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                         >
                           {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                       </div>
                    </div>
                    
                    {/* Active Modifiers Selector */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Link2 size={18} />
                        Active Modifier Groups
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select which options are available for this item (e.g. Sizes, Sauces, Meal Upgrades).</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                         {modifierGroups.map(group => {
                           const isActive = (activeProduct.modifierGroupIds || []).includes(group.id);
                           return (
                             <button
                               key={group.id}
                               type="button"
                               onClick={() => toggleModifierGroupForProduct(group.id)}
                               className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                 isActive 
                                   ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                                   : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                               }`}
                             >
                               <span>
                                 <span className="mr-1.5">{getModifierGroupEmoji(group.name)}</span>
                                 {group.name}
                               </span>
                               {isActive && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                             </button>
                           );
                         })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Select a product to edit</div>
                )}
              </div>
            </>
          )}

          {/* --- MODIFIERS TAB --- */}
          {activeTab === 'modifiers' && (
            <>
              {/* Sidebar - Groups */}
              <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Modifier Groups</h3>
                {modifierGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                      selectedGroupId === group.id 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent'
                    }`}
                  >
                    <span className="mr-1.5">{getModifierGroupEmoji(group.name)}</span>
                    {group.name}
                  </button>
                ))}
              </div>

              {/* Main Content - Options Editor */}
              <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900">
                 {activeGroup ? (
                   <div className="max-w-2xl mx-auto">
                     <div className="flex justify-between items-end mb-6">
                       <div>
                         <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeGroup.name} Options</h3>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage options available for this group.</p>
                       </div>
                     </div>

                     {/* Add New Option */}
                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 flex flex-col gap-3">
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Option Name</label>
                            <input 
                              type="text" 
                              value={newOptionName}
                              onChange={(e) => setNewOptionName(e.target.value)}
                              placeholder="e.g. Extra Cheese"
                              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
                            />
                          </div>
                          <div className="w-32">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Price ({CURRENCY})</label>
                            <input 
                              type="number" 
                              value={newOptionPrice}
                              onChange={(e) => setNewOptionPrice(e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3 items-end">
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Triggers Another Group? (Optional)</label>
                             <select 
                               value={newOptionTriggerId}
                               onChange={(e) => setNewOptionTriggerId(e.target.value)}
                               className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                             >
                               <option value="">-- No Trigger --</option>
                               {modifierGroups.filter(g => g.id !== activeGroup.id).map(g => (
                                 <option key={g.id} value={g.id}>Shows: {g.name}</option>
                               ))}
                             </select>
                           </div>
                           <button 
                            type="button"
                            onClick={handleAddOption}
                            className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-bold px-4 shadow-lg shadow-emerald-500/20"
                          >
                            <Plus size={18} /> Add Option
                          </button>
                        </div>
                     </div>

                     {/* Options List */}
                     <div className="space-y-3">
                       {activeGroup.options.map((option, idx) => {
                         const triggeredGroup = modifierGroups.find(g => g.id === option.triggersGroupId);
                         return (
                           <div key={`${option.name}-${idx}`} className="flex items-center gap-4 p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-500 transition-all bg-white dark:bg-slate-800 shadow-sm">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  <span className="mr-1.5">{getModifierEmoji(option.name)}</span>
                                  {option.name}
                                </div>
                                {triggeredGroup && (
                                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                                    <Link2 size={10} /> Triggers: {triggeredGroup.name}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="text-slate-400 text-sm">Price: {CURRENCY}</span>
                                 <input 
                                   type="number" 
                                   defaultValue={option.price}
                                   onBlur={(e) => handleEditOptionPrice(idx, parseFloat(e.target.value))}
                                   className="w-20 p-1 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded text-center text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                                   step="0.10"
                                 />
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDeleteOption(idx)}
                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                         );
                       })}
                     </div>

                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-400">Select a group to edit</div>
                 )}
              </div>
            </>
          )}

        </div>
        
        {/* --- Custom Delete Confirmation Modal --- */}
        {productToDelete && (
          <div className="absolute inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-sm border-2 border-slate-100 dark:border-slate-800">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                      <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Product?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">{productToDelete.name}</span>? 
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex w-full gap-3 pt-2">
                      <button 
                        onClick={() => setProductToDelete(null)}
                        className="flex-1 py-2.5 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmDeleteProduct}
                        className="flex-1 py-2.5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                      >
                        Delete
                      </button>
                  </div>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
