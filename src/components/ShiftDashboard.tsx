
import React, { useState, useEffect } from 'react';
import { Order, CartItem, PrinterDevice, Category } from '../types';
import { CURRENCY, getCategoryEmoji, getModifierEmoji } from '../constants';
import { printReceiptData } from '../services/printerService';
import { X, History, TrendingUp, DollarSign, Calendar, Printer, Pencil, Save, Trash2, Plus, Minus, CreditCard, Banknote, ChefHat, Clock } from 'lucide-react';

interface ShiftDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onReprintOrder: (order: Order) => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  connectedPrinter?: PrinterDevice | null;
  onCashOut: () => void;
}

export const ShiftDashboard: React.FC<ShiftDashboardProps> = ({ 
  isOpen, 
  onClose, 
  orders, 
  onReprintOrder,
  onUpdateOrder,
  connectedPrinter,
  onCashOut
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'cashout' | 'chef'>('history');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Auto-refresh for Chef Monitor (every 30s)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (isOpen && activeTab === 'chef') {
      const interval = setInterval(() => setTick(t => t + 1), 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Calculations for Cash Out
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // --- CHEF MONITOR LOGIC ---
  const now = new Date();
  const timeWindowStr = "30 mins";
  const timeWindow = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
  
  const recentOrders = orders.filter(o => o.date >= timeWindow);
  
  let fishCounts = {
    largeCod: 0,
    mediumCod: 0,
    codBites: 0,
    otherFish: 0
  };

  const recentFishItems: { time: Date, name: string, size: string, quantity: number, orderId: number }[] = [];

  recentOrders.forEach(order => {
    order.items.forEach(item => {
      const name = item.name.toLowerCase();
      // Identify Fish Items - exclude sides/sauces/cake (keep bites included now)
      if (item.category === Category.FISH && !name.includes('chips') && !name.includes('sausage') && !name.includes('sauce') && !name.includes('cake')) {
        
        let size = 'Standard';
        // Logic to detect size based on modifiers
        const sizeMod = item.modifiers.find(m => 
            (m.groupName === 'Fish Size') || 
            m.name === 'Large' || 
            m.name === 'Medium'
        );
        
        if (sizeMod) size = sizeMod.name;
        
        // Count Logic
        if (name.includes('bites')) {
            fishCounts.codBites += item.quantity;
            size = 'Portion';
        } else if (name.includes('cod')) {
            if (size === 'Large') fishCounts.largeCod += item.quantity;
            else fishCounts.mediumCod += item.quantity; // Default to medium if not explicit large
        } else {
            fishCounts.otherFish += item.quantity;
        }

        recentFishItems.push({
            time: order.date,
            name: item.name,
            size: size,
            quantity: item.quantity,
            orderId: order.id
        });
      }
    });
  });

  // Sort recent fish items by time (newest first)
  recentFishItems.sort((a, b) => b.time.getTime() - a.time.getTime());


  const startEditing = (order: Order) => {
    // Deep copy items to avoid mutating props directly during edit
    const deepCopyOrder = {
        ...order,
        items: order.items.map(item => ({
            ...item,
            modifiers: [...item.modifiers]
        }))
    };
    setEditingOrder(deepCopyOrder);
  };

  const calculateItemCost = (item: CartItem) => {
      if (item.manualPrice !== undefined) return item.manualPrice;
      const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      return item.price + modTotal;
  };

  const calculateEditingTotal = () => {
    if (!editingOrder) return 0;
    return editingOrder.items.reduce((sum, item) => sum + (calculateItemCost(item) * item.quantity), 0);
  };

  const updateEditItemQty = (index: number, delta: number) => {
    if (!editingOrder) return;
    const newItems = [...editingOrder.items];
    const item = newItems[index];
    const newQty = Math.max(0, item.quantity + delta);
    
    if (newQty === 0) {
        // Confirm removal? For now just remove
        newItems.splice(index, 1);
    } else {
        newItems[index] = { ...item, quantity: newQty };
    }
    
    setEditingOrder({ ...editingOrder, items: newItems });
  };

  const togglePaymentMethod = () => {
      if(!editingOrder) return;
      setEditingOrder({
          ...editingOrder,
          paymentMethod: editingOrder.paymentMethod === 'Cash' ? 'Card' : 'Cash'
      });
  };

  const saveChanges = () => {
      if (!editingOrder) return;
      // Recalculate total finally
      const newTotal = calculateEditingTotal();
      onUpdateOrder({ ...editingOrder, total: newTotal });
      setEditingOrder(null);
  };

  const handlePrintZReport = async () => {
    if (!confirm("CONFIRM CASH OUT?\n\nThis will print the Z-Report and DELETE all order history for the day.\n\nAre you sure you want to close the shift?")) {
      return;
    }

    if (connectedPrinter) {
        try {
            const reportContent = generateZReportText(orders);
            await printReceiptData(connectedPrinter, reportContent);
        } catch (e) {
            console.error("Printer error, falling back to browser print", e);
            window.print();
        }
    } else {
        window.print();
    }

    // Delay slightly to ensure print command sends before state clear
    setTimeout(() => {
        onCashOut();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden relative border border-slate-200 dark:border-neutral-800">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-black text-white p-6 flex justify-between items-center shrink-0 border-b border-slate-800 dark:border-neutral-800">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
               <TrendingUp size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold">Shift Dashboard</h2>
               <p className="text-slate-400 text-sm">Manager View • {new Date().toLocaleDateString()}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-black shrink-0">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-black border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
          >
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('chef')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'chef' ? 'bg-white dark:bg-black border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
          >
            <ChefHat size={18} />
            Chef Monitor
          </button>
          <button 
            onClick={() => setActiveTab('cashout')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'cashout' ? 'bg-white dark:bg-black border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
          >
            End of Day Cash Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-black p-6">
          
          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <History size={48} className="mb-4 opacity-50" />
                  <p>No orders processed yet today.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-900 dark:text-white">
                    <thead className="bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 uppercase font-medium">
                      <tr>
                        <th className="p-4 hidden sm:table-cell">ID</th>
                        <th className="p-4">Time</th>
                        <th className="p-4">Items</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {orders.slice().reverse().map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-700 dark:text-neutral-300 hidden sm:table-cell">#{order.id}</td>
                          <td className="p-4 text-slate-500 dark:text-neutral-400">{order.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="p-4 text-slate-700 dark:text-neutral-300">
                            <div className="line-clamp-2">
                                {order.items.map(i => i.quantity + 'x ' + i.name).join(', ')}
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{CURRENCY}{order.total.toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => startEditing(order)}
                                  className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-bold text-xs border border-blue-100 dark:border-blue-900/50"
                                  title="Edit Order"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => onReprintOrder(order)}
                                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors font-bold text-xs border border-slate-200 dark:border-neutral-700"
                                  title="Reprint Receipt"
                                >
                                  <Printer size={14} />
                                  Reprint
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CHEF MONITOR TAB */}
          {activeTab === 'chef' && (
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Clock size={28} className="text-emerald-500" />
                            Live Fish Counter
                        </h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">
                            Orders placed in the last <span className="font-bold text-slate-800 dark:text-white">{timeWindowStr}</span> ({timeWindow.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Now)
                        </p>
                    </div>
                    <button onClick={() => setTick(t => t + 1)} className="text-xs bg-slate-200 dark:bg-neutral-800 px-3 py-1 rounded text-slate-600 dark:text-neutral-300 hover:bg-slate-300 transition">
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Big Counters */}
                    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute right-[-10px] top-[-10px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                            <ChefHat size={100} />
                        </div>
                        <h4 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Large Cod</h4>
                        <div className="text-5xl font-black">{fishCounts.largeCod}</div>
                    </div>

                    <div className="bg-cyan-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute right-[-10px] top-[-10px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                            <ChefHat size={100} />
                        </div>
                        <h4 className="text-cyan-100 text-sm font-bold uppercase tracking-wider mb-2">Medium Cod</h4>
                        <div className="text-5xl font-black">{fishCounts.mediumCod}</div>
                    </div>

                    <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute right-[-10px] top-[-10px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                            <ChefHat size={100} />
                        </div>
                        <h4 className="text-amber-100 text-sm font-bold uppercase tracking-wider mb-2">Cod Bites</h4>
                        <div className="text-5xl font-black">{fishCounts.codBites}</div>
                    </div>

                    <div className="bg-neutral-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <h4 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-2">Other Fish</h4>
                        <div className="text-5xl font-black">{fishCounts.otherFish}</div>
                    </div>
                </div>

                {/* Detailed List */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 font-bold text-slate-600 dark:text-neutral-300 uppercase text-xs tracking-wider">
                        Recent Fish Orders ({timeWindowStr})
                    </div>
                    {/* Removed max-h-64 to let it expand naturally within the modal body */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-900 dark:text-white">
                            <thead className="bg-slate-50 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Qty</th>
                                    <th className="p-3">Item</th>
                                    <th className="p-3">Size</th>
                                    <th className="p-3">Order #</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                                {recentFishItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">No fish orders in the last 30 mins.</td>
                                    </tr>
                                ) : (
                                    recentFishItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="p-3 font-bold">{item.quantity}</td>
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                    item.size === 'Large' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
                                                    item.name.toLowerCase().includes('bites') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                                                    'bg-slate-100 text-slate-600 dark:bg-neutral-700 dark:text-neutral-300'
                                                }`}>
                                                    {item.size}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-slate-400">#{item.orderId}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {/* CASH OUT TAB */}
          {activeTab === 'cashout' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Summary Cards */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                      <DollarSign size={20} />
                      <span className="font-medium">Total Sales</span>
                    </div>
                    <p className="text-4xl font-bold">{CURRENCY}{totalRevenue.toFixed(2)}</p>
                 </div>
                 
                 <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-neutral-400">
                      <History size={20} />
                      <span className="font-medium">Total Orders</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">{totalOrders}</p>
                 </div>

                 <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-neutral-400">
                      <Calendar size={20} />
                      <span className="font-medium">Avg. Order</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">{CURRENCY}{averageOrderValue.toFixed(2)}</p>
                 </div>
              </div>

              {/* Z-Report Details */}
              <div className="col-span-1 md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 p-8 flex flex-col items-center">
                 <h3 className="text-xl font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-6 border-b-2 border-slate-800 dark:border-white pb-2 w-full text-center">Z-Report Preview</h3>
                 
                 <div className="font-mono text-sm w-full max-w-sm space-y-2 text-slate-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift Start:</span>
                      <span>09:00 AM</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Shift End:</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-300 dark:border-neutral-600 my-4"></div>
                    <div className="flex justify-between font-bold text-black dark:text-white text-lg">
                      <span>GROSS TOTAL</span>
                      <span>{CURRENCY}{totalRevenue.toFixed(2)}</span>
                    </div>
                 </div>

                 <button 
                   onClick={handlePrintZReport} 
                   className="mt-8 bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
                 >
                   <Printer size={18} />
                   Print Z-Report & Cash Out
                 </button>
              </div>

            </div>
          )}
        </div>

        {/* EDIT ORDER OVERLAY */}
        {editingOrder && (
            <div className="absolute inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5">
                <div className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 p-6 flex justify-between items-center shadow-sm">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Pencil size={20} className="text-blue-500" />
                            Editing Order #{editingOrder.id}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">{editingOrder.date.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setEditingOrder(null)}
                            className="px-4 py-2 text-slate-500 dark:text-neutral-400 font-bold hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveChanges}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* Items List */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
                            <div className="p-4 bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 font-bold text-slate-500 dark:text-neutral-400 text-sm uppercase tracking-wider">
                                Order Items
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                {editingOrder.items.map((item, idx) => {
                                    const unitPrice = calculateItemCost(item);
                                    const total = unitPrice * item.quantity;
                                    return (
                                        <div key={idx} className="p-4 flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800 dark:text-white">
                                                    <span className="mr-1.5">{getCategoryEmoji(item.category)}</span>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-neutral-400">
                                                    {item.modifiers.map(m => `${getModifierEmoji(m.name)} ${m.name}`).join(', ')}
                                                    {item.manualPrice !== undefined && <span className="text-amber-600 ml-2 font-bold">(Manual Price)</span>}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">Unit: {CURRENCY}{unitPrice.toFixed(2)}</div>
                                            </div>

                                            {/* Qty Control */}
                                            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700">
                                                <button 
                                                    onClick={() => updateEditItemQty(idx, -1)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-red-500 hover:bg-white dark:hover:bg-neutral-700 rounded-l-lg transition-colors"
                                                >
                                                    {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                                </button>
                                                <span className="w-8 text-center font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateEditItemQty(idx, 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-blue-500 hover:bg-white dark:hover:bg-neutral-700 rounded-r-lg transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <div className="w-24 text-right font-bold text-slate-800 dark:text-white">
                                                {CURRENCY}{total.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                                {editingOrder.items.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 italic">
                                        No items remaining. Order will be empty.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment & Summary */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6">
                                <h4 className="font-bold text-slate-500 dark:text-neutral-400 text-sm uppercase tracking-wider mb-4">Payment Method</h4>
                                <button 
                                    onClick={togglePaymentMethod}
                                    className={`w-full py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-3 transition-all ${
                                        editingOrder.paymentMethod === 'Card' 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    }`}
                                >
                                    {editingOrder.paymentMethod === 'Card' ? <CreditCard size={24} /> : <Banknote size={24} />}
                                    {editingOrder.paymentMethod}
                                    <span className="text-xs font-normal opacity-70 ml-2">(Click to swap)</span>
                                </button>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 flex flex-col justify-center items-end">
                                <h4 className="font-bold text-slate-500 dark:text-neutral-400 text-sm uppercase tracking-wider mb-1">New Total</h4>
                                <div className="text-4xl font-black text-slate-900 dark:text-white">
                                    {CURRENCY}{calculateEditingTotal().toFixed(2)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

// Helper for Thermal Z-Report Generation
const generateZReportText = (orders: Order[]) => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const cashOrders = orders.filter(o => o.paymentMethod === 'Cash');
    const cardOrders = orders.filter(o => o.paymentMethod === 'Card');
    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const cardTotal = cardOrders.reduce((sum, o) => sum + o.total, 0);
    
    // Formatting helper
    const center = (str: string) => {
        const width = 32; 
        const padding = Math.max(0, (width - str.length) / 2);
        return ' '.repeat(Math.floor(padding)) + str + '\n';
    };
    const line = (label: string, value: string) => {
        const width = 32;
        const spacing = Math.max(0, width - label.length - value.length);
        return label + ' '.repeat(spacing) + value + '\n';
    };
    const divider = '-'.repeat(32) + '\n';

    let txt = '\x1b\x40'; // Init
    txt += '\x1b\x61\x01'; // Center
    txt += '\x1b\x45\x01'; // Bold On
    txt += "Z-REPORT / END OF DAY\n";
    txt += '\x1b\x45\x00'; // Bold Off
    txt += new Date().toLocaleString() + "\n";
    txt += divider;
    txt += '\x1b\x61\x00'; // Left align
    
    txt += line("Total Orders:", totalOrders.toString());
    txt += line("Total Revenue:", `£${totalRevenue.toFixed(2)}`);
    txt += divider;
    
    txt += '\x1b\x45\x01'; // Bold
    txt += "PAYMENT BREAKDOWN\n";
    txt += '\x1b\x45\x00'; // Off
    txt += line("Cash:", `£${cashTotal.toFixed(2)}`);
    txt += line("Card:", `£${cardTotal.toFixed(2)}`);
    txt += divider;
    
    txt += "\n\n";
    txt += center("Shift Closed");
    txt += "\n\n\n";
    txt += '\x1d\x56\x42\x00'; // Cut
    
    return txt;
};
