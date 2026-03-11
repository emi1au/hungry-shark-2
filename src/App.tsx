import { useState, useCallback, useEffect, useMemo } from 'react';
import { MenuGrid } from './components/MenuGrid';
import { CartSidebar } from './components/CartSidebar';
import { AiOrderAssistant } from './components/AiOrderAssistant';
import { ModifierModal } from './components/ModifierModal';
import { Receipt } from './components/Receipt';
import { ShiftDashboard } from './components/ShiftDashboard';
import { MenuManager } from './components/MenuManager';
import { PaymentModal } from './components/PaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { MENU_ITEMS, DEFAULT_MODIFIER_GROUPS, getModifierGroupIdsForItem, CURRENCY, getCategoryColor, getCategoryEmoji, DELIVERY_CHARGE } from './constants';
import { Category, MenuItem, CartItem, Order, ModifierGroup, ModifierOption, PrinterDevice, OrderAnalysis, OrderType, CustomerDetails } from './types';
import { printReceiptData } from './services/printerService';
import { generateReceiptContent } from './services/receiptService';
import { fetchOrders, saveOrders } from './services/storageService';
import { calculateChipsPrice } from './utils/modifierUtils';
import { Search, Sparkles, Settings as SettingsIcon, LayoutGrid, Fish, Circle, Drumstick, Sandwich, Pizza, Coffee, Utensils, UtensilsCrossed, ClipboardList, RefreshCw, Menu, Monitor, List, Plus } from 'lucide-react';

// --- Helper Functions ---

const App = () => {
  // Master Tab State
  const [activeMasterTab, setActiveMasterTab] = useState<'TV1' | 'TV2' | 'TV3' | 'TV4'>('TV1');
  
  // View Mode State - Default to 'detailed' for dashboard view
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('compact');

  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  
  // Sidebar Reset Key (To clear delivery state on checkout)
  const [sidebarKey, setSidebarKey] = useState(0);
  
  // Menu Grid Refresh Key (To reset card state on checkout)
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Menu Grid Force Refresh Key (To reset card state on checkout)
  const [refreshMenuKey, setRefreshMenuKey] = useState(0);
  
  // Pending Checkout State
  const [pendingOrderDetails, setPendingOrderDetails] = useState<{
    type: OrderType, 
    customer?: CustomerDetails, 
    initialPaymentMethod?: 'Cash' | 'Card',
    isDeliveryChargeApplied?: boolean
  }>({ type: 'Takeaway' });

  // State for Menu Items (Using v7 key to bust cache for user)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('hs_menuItems_v10');
      return saved ? JSON.parse(saved) : MENU_ITEMS;
    } catch (e) {
      console.error("Failed to load menu items", e);
      return MENU_ITEMS;
    }
  });

  // State for Modifiers (Using v10 key to bust cache)
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(() => {
    try {
      const saved = localStorage.getItem('hs_modifierGroups_v10');
      return saved ? JSON.parse(saved) : DEFAULT_MODIFIER_GROUPS;
    } catch (e) {
      console.error("Failed to load modifier groups", e);
      return DEFAULT_MODIFIER_GROUPS;
    }
  });

  // Hardware State - Default to Sunmi Internal Printer (Auto-connect)
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>({
    id: 'net_127.0.0.1_9100',
    name: 'Sunmi Internal Printer',
    type: 'network',
    status: 'connected',
    ipAddress: '127.0.0.1',
    port: '9100'
  });
  
  // Till Name
  const [tillName, setTillName] = useState(() => {
    return localStorage.getItem('hs_tillName') || 'Main Till';
  });

  // Checkout / Receipt / History State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Order details for Receipt (Persisted after cart clear)
  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const [lastOrderCustomer, setLastOrderCustomer] = useState<CustomerDetails | undefined>(undefined);
  const [lastOrderType, setLastOrderType] = useState<OrderType>('Takeaway');
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  
  // Derived Order Number (Always next in sequence from synced orders)
  const orderNumber = useMemo(() => {
    if (orders.length === 0) return 1;
    // Find absolute max ID to ensure uniqueness across synchronized devices
    const maxId = Math.max(...orders.map(o => o.id));
    return maxId + 1;
  }, [orders]);

  const [lastOrderDate, setLastOrderDate] = useState<Date>(new Date());
  const [lastOrderPaymentInfo, setLastOrderPaymentInfo] = useState<{method: 'Cash'|'Card', tendered?: number, change?: number}>({method: 'Cash'});
  const [completedOrderNumber, setCompletedOrderNumber] = useState(1); // Snapshot for receipt

  // Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isShiftDashboardOpen, setIsShiftDashboardOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Selection / Editing State
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [preSelectedModifiers, setPreSelectedModifiers] = useState<ModifierOption[]>([]); // For when opening modal with inline selections

  // -- Initial Load & Sync Polling --
  const refreshOrders = useCallback(async () => {
    setIsSyncing(true);
    const loaded = await fetchOrders();
    setOrders(loaded);
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    refreshOrders();
    // Poll every 10 seconds to keep devices in sync
    const interval = setInterval(refreshOrders, 10000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // -- Persistence Effects --
  useEffect(() => {
    localStorage.setItem('hs_menuItems_v8', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('hs_modifierGroups_v8', JSON.stringify(modifierGroups));
  }, [modifierGroups]);

  useEffect(() => {
    localStorage.setItem('hs_tillName', tillName);
  }, [tillName]);

  // Reset category when switching Master Tabs
  useEffect(() => {
    setActiveCategory('All');
  }, [activeMasterTab]);

  // --- MASTER TAB FILTER LOGIC ---
  const masterTabItems = useMemo(() => {
    return menuItems.filter(item => {
      const cat = item.category;
      
      // TV1: Fish, Pie, Sausages
      if (activeMasterTab === 'TV1') {
        return [Category.FISH, Category.PIES, Category.SAUSAGES].includes(cat);
      }
      
      // TV2: Chips, Kids, Pots
      if (activeMasterTab === 'TV2') {
        if (item.name === "Kid's 6 - Chips & Sauce") return false;
        return [Category.CHIPS, Category.KIDS_MEALS, Category.POTS].includes(cat);
      }
      
      // TV3: Burger, Wraps, Kebabs
      if (activeMasterTab === 'TV3') {
        return [Category.BURGERS, Category.WRAPS, Category.KEBABS].includes(cat);
      }
      
      // TV4: Chicken, Bites, Sides (Rest), Drinks
      if (activeMasterTab === 'TV4') {
        return [Category.CHICKEN, Category.BITES, Category.SIDES, Category.DRINKS].includes(cat);
      }
      
      return true;
    });
  }, [menuItems, activeMasterTab]);

  // Available Categories in current Master Tab (for Pill Navigation)
  const availableCategories = useMemo(() => {
    const cats = new Set(masterTabItems.map(i => i.category));
    // Sort them according to standard enum order
    return Object.values(Category).filter(c => cats.has(c));
  }, [masterTabItems]);

  // Final Filter (Category + Search)
  const filteredItems = masterTabItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to get modifier groups for an item based on current state
  const getModifiersForItem = (item: MenuItem): ModifierGroup[] => {
    const groupIds = getModifierGroupIdsForItem(item);
    return groupIds.map(id => modifierGroups.find(g => g.id === id)).filter(Boolean) as ModifierGroup[];
  };

  // Helper to remove "default" modifiers from the cart (e.g. No Chip)
  const cleanModifiers = (modifiers: ModifierOption[]) => {
    return modifiers.filter(m => {
      const name = m.name.toLowerCase();
      // Keep if it has a price
      if (m.price > 0) return true;
      // Filter out specific default/negative options
      if (['no chip', 'pie only', 'burger only'].includes(name)) return false;
      return true;
    });
  };

  // Main add logic
  const addItemToCartFinal = (item: MenuItem, modifiers: ModifierOption[], quantityToAdd: number = 1, instructions?: string) => {
    // Adding an item resets manual total override to ensure accuracy
    setManualTotal(null);

    const cleanedModifiers = cleanModifiers(modifiers);

    setCart((prev) => {
      const sortedNewMods = [...cleanedModifiers].map(m => m.name).sort().join('|');
      
      const customPrice = calculateChipsPrice(item.name, cleanedModifiers);
      
      const existingIndex = prev.findIndex((i) => 
        i.id === item.id && 
        [...i.modifiers].map(m => m.name).sort().join('|') === sortedNewMods &&
        i.manualPrice === customPrice && // Don't merge with manually priced items unless they match
        i.instructions === instructions // Don't merge if instructions differ
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd
        };
        return updated;
      }
      
      return [...prev, { 
        ...item, 
        cartId: `${item.id}-${Date.now()}-${Math.random()}`, 
        quantity: quantityToAdd,
        modifiers: cleanedModifiers,
        instructions,
        ...(customPrice !== null ? { manualPrice: customPrice } : {})
      }];
    });
  };

  const handleItemClick = (item: MenuItem) => {
    const validModifiers = getModifiersForItem(item);
    if (validModifiers.length > 0) {
      setSelectedItemForModifiers(item);
      setEditingCartItem(null);
      setIsModifierModalOpen(true);
    } else {
      addItemToCartFinal(item, []);
    }
  };

  // Called when "Customize" is clicked on the card
  const handleOpenModifierModal = (item: MenuItem, currentModifiers: ModifierOption[]) => {
    setSelectedItemForModifiers(item);
    setPreSelectedModifiers(currentModifiers); // Pass in what was selected on the card
    setEditingCartItem(null);
    setIsModifierModalOpen(true);
  };

  const handleEditCartItem = (item: CartItem) => {
    setSelectedItemForModifiers(item);
    setPreSelectedModifiers(item.modifiers);
    setEditingCartItem(item);
    setIsModifierModalOpen(true);
  };

  const handleUpdateItemPrice = (cartId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, manualPrice: newPrice };
      }
      return item;
    }));
    setManualTotal(null); // Reset global total override if individual items change
  };

  const handleModifierConfirm = (item: MenuItem, selectedModifiers: ModifierOption[], quantity: number = 1, instructions?: string) => {
    const cleanedModifiers = cleanModifiers(selectedModifiers);
    const customPrice = calculateChipsPrice(item.name, cleanedModifiers);

    if (editingCartItem) {
      setCart(prev => prev.map(cartItem => {
        if (cartItem.cartId === editingCartItem.cartId) {
          // If editing, allow updating quantity too
          return { 
            ...cartItem, 
            modifiers: cleanedModifiers, 
            quantity: quantity, 
            instructions,
            ...(customPrice !== null ? { manualPrice: customPrice } : { manualPrice: undefined })
          };
        }
        return cartItem;
      }));
      setEditingCartItem(null);
      setManualTotal(null);
    } else {
      addItemToCartFinal(item, cleanedModifiers, quantity, instructions);
    }
  };

  const updateQuantity = useCallback((cartId: string, delta: number) => {
    setManualTotal(null);
    setCart((prev) => 
      prev.map((item) => {
        if (item.cartId === cartId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setManualTotal(null);
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setManualTotal(null);
  }, []);

  const handleInitiateCheckout = (type: OrderType, customer?: CustomerDetails, paymentMethod: 'Cash' | 'Card' = 'Card', applyDeliveryCharge?: boolean) => {
    if (cart.length === 0) return;
    setPendingOrderDetails({ 
      type, 
      customer, 
      initialPaymentMethod: paymentMethod, 
      isDeliveryChargeApplied: applyDeliveryCharge 
    });
    setIsPaymentModalOpen(true);
  };

  // Calculate current calculated total
  const calculatedTotal = cart.reduce((sum, item) => {
    if (item.manualPrice !== undefined) {
      return sum + (item.manualPrice * item.quantity);
    }
    const modTotal = item.modifiers.reduce((mSum, m) => mSum + m.price, 0);
    return sum + ((item.price + modTotal) * item.quantity);
  }, 0) + (pendingOrderDetails.type === 'Delivery' && pendingOrderDetails.isDeliveryChargeApplied !== false ? DELIVERY_CHARGE : 0);

  // The actual final total used for payment (Manual overrides Calculated)
  const finalTotal = manualTotal !== null ? manualTotal : calculatedTotal;

  const handlePaymentConfirm = async (method: 'Cash' | 'Card', tendered: number, change: number) => {
    // 1. Fetch latest orders to ensure orderNumber is sequential across devices (if synced)
    const latestOrders = await fetchOrders();
    const nextId = latestOrders.length > 0 ? Math.max(...latestOrders.map(o => o.id)) + 1 : 1;
    
    const date = new Date();

    const newOrder: Order = {
      id: nextId,
      items: [...cart],
      total: finalTotal, // Use the final total (calculated or manual)
      date: date,
      paymentMethod: method,
      amountTendered: tendered,
      changeDue: change,
      orderType: pendingOrderDetails.type,
      customer: pendingOrderDetails.customer
    };

    // 2. Append and Save to Remote/Local
    const updatedOrders = [...latestOrders, newOrder];
    setOrders(updatedOrders);
    await saveOrders(updatedOrders);
    
    // Save details for the Receipt Preview
    setLastOrderItems([...cart]);
    setLastOrderTotal(finalTotal);
    setLastOrderDate(date);
    setLastOrderPaymentInfo({ method, tendered, change });
    setLastOrderCustomer(pendingOrderDetails.customer);
    setLastOrderType(pendingOrderDetails.type);
    setCompletedOrderNumber(nextId);
    
    // Auto-Print Receipt if Connected
    if (connectedPrinter) {
      try {
        const receiptText = generateReceiptContent(newOrder, tillName);
        await printReceiptData(connectedPrinter, receiptText);
      } catch (err) {
        console.error("Auto print failed:", err);
      }
    }

    // Reset Cart and Overrides
    setCart([]);
    setManualTotal(null);
    setPendingOrderDetails({ type: 'Takeaway' });
    setSidebarKey(prev => prev + 1); // Force reset of sidebar state (Delivery Details)
    setRefreshKey(prev => prev + 1); // Force reset of MenuGrid
    setRefreshMenuKey(prev => prev + 1);
    
    setIsPaymentModalOpen(false);
    // Don't open receipt preview automatically
    setIsReceiptOpen(false); 
  };

  const handlePrintPreview = () => {
    // Populate receipt state with current cart data for preview
    setLastOrderItems([...cart]);
    setLastOrderTotal(finalTotal);
    setLastOrderDate(new Date());
    setLastOrderPaymentInfo({ method: 'Cash', tendered: 0, change: 0 }); // Placeholder
    setLastOrderCustomer(pendingOrderDetails.customer);
    setLastOrderType(pendingOrderDetails.type);
    setCompletedOrderNumber(orderNumber); // Predicted next ID
    
    setIsReceiptOpen(true);
  };
  
  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
  };

  const handleReprintOrder = async (order: Order) => {
    if (!connectedPrinter) {
      alert("No printer connected. Please connect a printer in Settings to reprint.");
      return;
    }
    try {
      const receiptText = generateReceiptContent(order, tillName);
      await printReceiptData(connectedPrinter, receiptText);
    } catch (err) {
      console.error("Reprint failed:", err);
      alert("Failed to send reprint command.");
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    const updatedList = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updatedList);
    await saveOrders(updatedList);
  };

  // Handler for printing from the Receipt Modal (current order)
  const handlePrintReceipt = async (copies: number = 1) => {
    if (connectedPrinter) {
      // Use the snapshot ID
      const orderToPrint = orders.find(o => o.id === completedOrderNumber) || {
          id: completedOrderNumber,
          items: lastOrderItems,
          total: lastOrderTotal,
          date: lastOrderDate,
          paymentMethod: lastOrderPaymentInfo.method,
          amountTendered: lastOrderPaymentInfo.tendered,
          changeDue: lastOrderPaymentInfo.change,
          orderType: lastOrderType,
          customer: lastOrderCustomer
      } as Order;

      try {
          const receiptText = generateReceiptContent(orderToPrint, tillName);
          
          for (let i = 0; i < copies; i++) {
             await printReceiptData(connectedPrinter, receiptText);
             // Small delay between multiple prints to allow printer buffer to clear
             if (i < copies - 1) {
                 await new Promise(resolve => setTimeout(resolve, 1500));
             }
          }
      } catch (e) {
          console.error("Print failed", e);
          alert("Failed to print to connected printer.");
      }
    }
  };

  const handleUpdateModifierGroup = (updatedGroup: ModifierGroup) => {
    setModifierGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems(prev => [...prev, newItem]);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleResetMenu = () => {
    setMenuItems(MENU_ITEMS);
    setModifierGroups(DEFAULT_MODIFIER_GROUPS);
    localStorage.removeItem('hs_menuItems_v8');
    localStorage.removeItem('hs_modifierGroups_v8');
  };

  const handleCashOut = async () => {
    setOrders([]);
    setLastOrderItems([]);
    await saveOrders([]); // Clear remote and local
    setIsShiftDashboardOpen(false);
    alert("Shift Closed Successfully. All daily orders cleared from local and cloud.");
  };

  const handleAiOrderProcessed = (aiItems: OrderAnalysis['items']) => {
    aiItems.forEach((aiItem) => {
      const match = menuItems.find(
        (m) => m.name.toLowerCase() === aiItem.name.toLowerCase() || 
               m.name.toLowerCase().includes(aiItem.name.toLowerCase())
      );

      if (match) {
        const availableGroups = getModifiersForItem(match);
        const resolvedModifiers: ModifierOption[] = [];

        if (aiItem.modifiers) {
          aiItem.modifiers.forEach(modString => {
             for (const group of availableGroups) {
               const option = group.options.find(o => o.name.toLowerCase() === modString.toLowerCase());
               if (option) {
                 resolvedModifiers.push({ ...option, groupId: group.id, groupName: group.name });
                 break; 
               }
             }
          });
        }
        addItemToCartFinal(match, resolvedModifiers, aiItem.quantity);
      }
    });
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case Category.FISH: return <Fish size={18} />;
      case Category.CHIPS: return <div className="font-black text-xs">🍟</div>;
      case Category.BURGERS: return <Sandwich size={18} />;
      case Category.KEBABS: return <Utensils size={18} />;
      case Category.WRAPS: return <Pizza size={18} className="rotate-45" />; // Generic food shape
      case Category.DRINKS: return <Coffee size={18} />;
      case Category.PIES: return <Circle size={18} />;
      case Category.SAUSAGES: return <Drumstick size={18} />;
      default: return <UtensilsCrossed size={18} />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:hidden text-slate-900">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100/50 relative">
          
          {/* Top Navigation Bar */}
          <header className="bg-white border-b border-slate-200 shadow-sm z-20 flex flex-col shrink-0">

            {/* TV Section & Menu Button (Moved above Categories) */}
            <div className="px-4 md:px-6 pt-2 pb-2 flex justify-between items-center">
              <div className="flex gap-2 md:gap-4">
                 {['TV1', 'TV2', 'TV3', 'TV4'].map(tab => {
                   const getTabIcon = (t: string) => {
                     if (t === 'TV1') return '🐟 ';
                     if (t === 'TV2') return '🍟 ';
                     if (t === 'TV3') return '🌯 ';
                     if (t === 'TV4') return '🍗 ';
                     return '';
                   };
                   return (
                   <button
                     key={tab}
                     onClick={() => setActiveMasterTab(tab as any)}
                     className={`flex items-center justify-center px-6 py-2 rounded-xl transition-all duration-200 shadow-sm border-2 ${
                       activeMasterTab === tab 
                         ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02] -translate-y-1' 
                         : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                     }`}
                   >
                     <span className="font-black text-sm md:text-base uppercase tracking-wide">{getTabIcon(tab)}{tab}</span>
                   </button>
                   );
                 })}
              </div>
              
              {/* Admin Dropdown */}
              <div className="relative">
                 {/* Backdrop to close dropdown when clicking outside */}
                 {isDropdownOpen && (
                     <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                 )}
                 
                 <button 
                     onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-sm border-2 relative z-50 ${isDropdownOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                 >
                     <Menu size={18} />
                     <span className="hidden lg:inline">Menu</span>
                 </button>

                 {isDropdownOpen && (
                     <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right flex flex-col gap-1">
                         <button 
                             onClick={() => { setIsShiftDashboardOpen(true); setIsDropdownOpen(false); }} 
                             className="text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3 transition-colors"
                         >
                             <ClipboardList size={18} className="text-blue-500" />
                             Shift Dashboard
                         </button>
                         <button 
                             onClick={() => { setIsMenuManagerOpen(true); setIsDropdownOpen(false); }} 
                             className="text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3 transition-colors"
                         >
                             <SettingsIcon size={18} className="text-emerald-500" />
                             Menu Manager
                         </button>
                         <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                         <button 
                             onClick={() => { setIsSettingsModalOpen(true); setIsDropdownOpen(false); }} 
                             className="text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3 transition-colors"
                         >
                             <SettingsIcon size={18} className="text-slate-400" />
                             Settings
                         </button>
                     </div>
                 )}
              </div>
            </div>

            {/* Bottom Row: Categories (Horizontal Scroll) + View Toggle */}
            <div className="border-t border-slate-200 pt-2 px-4 md:px-6 pb-2 flex gap-4 items-center">
              <nav className="flex-1 overflow-x-auto flex gap-2 md:gap-3 custom-scrollbar select-none pb-1 min-w-0 items-center">
                  {/* All Items Button */}
                  <button
                    onClick={() => setActiveCategory('All')}
                    className={`shrink-0 px-5 py-2.5 rounded-full flex items-center gap-2 transition-all duration-200 ${
                      activeCategory === 'All' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <LayoutGrid size={18} strokeWidth={2.5} />
                    <span className="text-sm font-bold whitespace-nowrap">All Items</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 mx-1"></div>

                  {/* Categories */}
                  {availableCategories.map((cat) => {
                    const color = getCategoryColor(cat);
                    const isActive = activeCategory === cat;
                    
                    // Dynamic classes based on category color
                    let activeClass = '';
                    let inactiveClass = `bg-white text-slate-600 border border-slate-200 hover:border-${color}-300 hover:text-${color}-600`;
                    
                    if (isActive) {
                        activeClass = `bg-white border-2 border-${color}-500 text-${color}-600 shadow-md transform scale-105`;
                    }

                    // Fallback for dynamic class safety if needed, but standard template literals usually work
                    // Using specific colors for common categories to ensure Tailwind picks them up
                    if (color === 'blue') {
                        activeClass = isActive ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md transform scale-105' : '';
                        inactiveClass = !isActive ? 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600' : '';
                    } else if (color === 'amber') {
                        activeClass = isActive ? 'bg-white border-2 border-amber-500 text-amber-600 shadow-md transform scale-105' : '';
                        inactiveClass = !isActive ? 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-600' : '';
                    } else if (color === 'rose') {
                        activeClass = isActive ? 'bg-white border-2 border-rose-500 text-rose-600 shadow-md transform scale-105' : '';
                        inactiveClass = !isActive ? 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-600' : '';
                    }

                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 px-5 py-2.5 rounded-full flex items-center gap-2 transition-all duration-200 font-bold text-sm whitespace-nowrap ${isActive ? activeClass : inactiveClass}`}
                      >
                        <span className="mr-1">{getCategoryEmoji(cat)}</span>
                        {cat.replace('&', '& ')}
                      </button>
                    );
                  })}
              </nav>

              {/* View Mode Toggle */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex shrink-0 border border-slate-200 dark:border-slate-700">
                 <button 
                   onClick={() => setViewMode('compact')} 
                   className={`p-2 rounded-full transition-all ${viewMode === 'compact' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                   title="Compact List View"
                 >
                   <List size={20} />
                 </button>
                 <button 
                   onClick={() => setViewMode('detailed')} 
                   className={`p-2 rounded-full transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                   title="Detailed Card View"
                 >
                   <LayoutGrid size={20} />
                 </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative p-2">
            <MenuGrid 
              key={refreshMenuKey}
              items={filteredItems} 
              modifierGroups={modifierGroups}
              onAddToOrder={addItemToCartFinal}
              onOpenModal={handleOpenModifierModal}
              groupByCategory={activeCategory === 'All' && !searchQuery} 
              viewMode={viewMode}
            />
          </div>

          {/* Quick Add Bar (Compact View Only) */}
          {viewMode === 'compact' && (
            <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 shrink-0 overflow-x-auto custom-scrollbar flex flex-col gap-4">
              <div className="flex gap-6 min-w-max px-2 items-start">
                {[
                  {
                    title: 'Fish',
                    items: [
                      { label: 'Cod', name: 'Cod' },
                      { label: 'Bites', name: 'Cod Bites' },
                      { label: 'Fish', name: 'Fish Cake' },
                    ]
                  },
                  {
                    title: 'Chips',
                    items: [
                      { label: 'Chips', name: 'Chips' },
                      { label: 'Butty', name: 'Chip Butty (Lrg)' },
                      { label: 'Bread roll', name: 'Bread Roll' },
                    ]
                  },
                  {
                    title: 'Side',
                    items: [
                      { label: 'Drinks', name: 'Drinks' },
                      { label: 'Pot', name: 'Sauce Pot' },
                      { label: 'Salad', name: 'Green Salad' },
                    ]
                  },
                  {
                    title: 'Chicken',
                    items: [
                      { label: 'Breast', name: 'Chicken Breast' },
                      { label: 'Chicken curry', name: 'Chicken Curry' },
                      { label: 'Wings', name: 'Spicy Wings (6 pcs)' },
                    ]
                  },
                  {
                    title: 'Bites',
                    items: [
                      { label: 'Strip', name: 'Chicken Strips (5 pcs)' },
                      { label: 'Nuggets', name: 'Chicken Nuggets (6 pcs)' },
                    ]
                  },
                  {
                    title: 'Snack',
                    items: [
                      { label: 'Sticks', name: 'Breaded Cheese Sticks (6)' },
                      { label: 'Jalapeno', name: 'Jalapeno Cream Cheese (6)' },
                    ]
                  }
                ].map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-2 w-32">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.title}:</span>
                    {col.items.map(({ label, name }) => {
                      const item = menuItems.find(i => i.name === name);
                      if (!item) return null;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleOpenModifierModal(item, [])}
                          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 w-full justify-start"
                        >
                          <Plus size={14} className="text-blue-500 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 min-w-max px-2 items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center mr-2 w-16">Kids:</span>
                {[
                  { name: "Kid's 1 - Fish Cake", label: "Kid - Fish" },
                  { name: "Kid's 2 - Cod Bites", label: "Kid - Cod" },
                  { name: "Kid's 3 - Sausage", label: "Kid - Sausage" },
                  { name: "Kid's 4 - Nuggets", label: "Kid - 4 Nuggets" },
                  { name: "Kid's 5 - Strips", label: "Kid - 2 Strips" }
                ].map(kidItem => {
                  const item = menuItems.find(i => i.name === kidItem.name);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOpenModifierModal(item, [])}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} className="text-blue-500" />
                      {kidItem.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar (Cart) */}
        <aside className="w-[400px] min-w-[400px] h-full z-10 border-l border-slate-200 shadow-2xl bg-white">
          <CartSidebar 
            key={sidebarKey}
            cartItems={cart} 
            manualTotal={manualTotal}
            setManualTotal={setManualTotal}
            onUpdateQuantity={updateQuantity} 
            onUpdateItemPrice={handleUpdateItemPrice}
            onRemoveItem={removeItem}
            onEditItem={handleEditCartItem}
            onCheckout={handleInitiateCheckout}
            onClearCart={handleClearCart}
          />
        </aside>

        {/* Modals */}
        <AiOrderAssistant 
          isOpen={isAiModalOpen} 
          onClose={() => setIsAiModalOpen(false)} 
          onOrderProcessed={handleAiOrderProcessed}
          menuItems={menuItems}
        />

        <ModifierModal 
          isOpen={isModifierModalOpen}
          onClose={() => setIsModifierModalOpen(false)}
          item={selectedItemForModifiers}
          onAddToCart={handleModifierConfirm}
          initialSelections={preSelectedModifiers}
          initialInstructions={editingCartItem?.instructions}
          isEditing={!!editingCartItem}
        />
        
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          total={finalTotal}
          cartItems={cart} // Pass cart for persistence
          orderDetails={pendingOrderDetails} // Pass details for persistence
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handlePaymentConfirm}
          connectedPrinter={connectedPrinter}
          setConnectedPrinter={setConnectedPrinter}
          initialPaymentMethod={pendingOrderDetails.initialPaymentMethod}
          onPrintPreview={handlePrintPreview}
        />
        
        <ShiftDashboard 
          isOpen={isShiftDashboardOpen}
          onClose={() => setIsShiftDashboardOpen(false)}
          orders={orders}
          onReprintOrder={handleReprintOrder}
          onUpdateOrder={handleUpdateOrder}
          connectedPrinter={connectedPrinter}
          onCashOut={handleCashOut}
        />

        <MenuManager 
          isOpen={isMenuManagerOpen}
          onClose={() => setIsMenuManagerOpen(false)}
          modifierGroups={modifierGroups}
          onUpdateModifierGroup={handleUpdateModifierGroup}
          menuItems={menuItems}
          onUpdateMenuItem={handleUpdateMenuItem}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          onResetMenu={handleResetMenu}
        />

        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          connectedPrinter={connectedPrinter}
          setConnectedPrinter={setConnectedPrinter}
          tillName={tillName}
          setTillName={setTillName}
        />

      </div>

      <Receipt 
        isOpen={isReceiptOpen}
        items={lastOrderItems}
        total={orders.find(o => o.id === completedOrderNumber)?.total || lastOrderTotal} 
        orderNumber={completedOrderNumber}
        date={lastOrderDate}
        onClose={handleCloseReceipt}
        paymentInfo={lastOrderPaymentInfo}
        onReprint={connectedPrinter ? handlePrintReceipt : undefined}
        customer={lastOrderCustomer}
        orderType={lastOrderType}
      />
    </>
  );
};

export default App;
