
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { CartItem, OrderType, CustomerDetails } from '../types';
import { isInlineModifier } from '../utils/modifierUtils';
import { CURRENCY, SHOP_LOCATION, MAX_DELIVERY_MILES, DELIVERY_CHARGE, getCategoryEmoji, getModifierEmoji } from '../constants';
import { Trash2, Minus, Plus, ShoppingBag, CreditCard, Pencil, Utensils, Check, X, AlertCircle, Percent, MapPin, Phone, Truck, Search, Loader2, RotateCcw } from 'lucide-react';

interface CartSidebarProps {
  cartItems: CartItem[];
  manualTotal: number | null;
  setManualTotal: (total: number | null) => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onUpdateItemPrice: (cartId: string, newPrice: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onEditItem: (item: CartItem) => void;
  onCheckout: (type: OrderType, customer?: CustomerDetails, paymentMethod?: 'Cash' | 'Card', applyDeliveryCharge?: boolean) => void;
}

const POSTCODE_STREET_MAPPING: Record<string, string[]> = {
  "CF62 3AA": ["Waycock Road"],
  "CF62 5BR": ["Neptune Road"],
  "CF62 5TJ": ["Friars Road"],
  "CF62 5TS": ["Paget Road"],
  "CF62 5TR": ["Harbour Road"],
  "CF62 5TT": ["Breaksea Drive"],
  "CF62 5TU": ["Butlins Road"],
  "CF62 5TV": ["Marine Drive"],
  "CF62 6BW": ["Holton Road"],
  "CF62 6BX": ["Broad Street"],
  "CF62 6BY": ["High Street"],
  "CF62 6BZ": ["Gladstone Road"],
  "CF62 6DA": ["Court Road"],
  "CF62 6DB": ["Thompson Street"],
  "CF62 6JN": ["Glamorgan Street"],
  "CF62 6JP": ["Glamorgan Street"],
  "CF62 6JQ": ["Vale Street"],
  "CF62 6JR": ["Castle Street"],
  "CF62 7DR": ["Colcot Road"],
  "CF62 7DS": ["Romilly Road"],
  "CF62 7DT": ["Tynewydd Road"],
  "CF62 7DU": ["Port Road"],
  "CF62 7DW": ["Wyndham Avenue"],
  "CF62 7DX": ["Mount Pleasant"],
  "CF62 7JE": ["Claude Road"],
  "CF62 7JF": ["Claude Road"],
  "CF62 7JQ": ["Blackberry Drive"],
  "CF62 8AA": ["St Nicholas Road"],
  "CF62 8AB": ["Treharne Road"],
  "CF62 8AD": ["Park Crescent"],
  "CF62 8AE": ["Maes Rhydd"],
  "CF62 8AF": ["Clos-y-Morfa"],
  "CF62 8AG": ["Heol Ceiniog"],
  "CF62 8AH": ["Heol Yr Ysgol"],
  "CF62 8UJ": ["Colcot Road"],
  "CF62 9AF": ["Cornwall Road"],
  "CF62 9AH": ["Cornwall Road"],
  "CF62 9AG": ["Cornwall Rise"],
  "CF62 9AS": ["Carmarthen Close"],
  "CF62 9AU": ["Cornwall Road, Llys Lechwedd"],
  "CF62 9EB": ["Lydstep Road"],
  "CF62 9EH": ["Carew Close"],
  "CF62 9ES": ["Main Street"],
  "CF63 1AA": ["Cardiff Road"],
  "CF63 1AB": ["Station Road", "Court Road"],
  "CF63 1AD": ["Vale View"],
  "CF63 1AE": ["The Walk"],
  "CF63 1AF": ["West Street"],
  "CF63 1BA": ["Barry Road"],
  "CF63 1BD": ["Barry Road"],
  "CF63 1BS": ["Chesterfield Street"],
  "CF63 1EZ": ["Chilcote Street"],
  "CF63 1JX": ["Church Road"],
  "CF63 1JY": ["Church Road"],
  "CF63 1ND": ["Church Terrace"],
  "CF63 1NN": ["Colbrook Road East"],
  "CF63 1NF": ["Colbrook Road East"],
  "CF63 1NG": ["Colbrook Road East"],
  "CF63 1AY": ["Cottrel Square"],
  "CF63 2AA": ["Church Road"],
  "CF63 2AB": ["Hill View"],
  "CF63 2AD": ["Mill Lane"],
  "CF63 2AE": ["Park Lane"],
  "CF63 2AS": ["Arno Road"],
  "CF63 2BU": ["Barry Road"],
  "CF63 2FU": ["Main Street"],
  "CF63 2PB": ["Morlais Street"],
  "CF63 2PF": ["Vere Street"],
  "CF63 3NU": ["Coigne Terrace"],
  "CF63 4JW": ["Coronation Street"],
  "CF63 4JX": ["Coronation Street"],
  "CF63 4LL": ["Castleland Street"],
  "CF63 4LN": ["Castleland Street"],
  "CF63 4LP": ["Castleland Street"],
  "CF63 4QS": ["Clos Periant"],
  "CF63 4QQ": ["Clos Tyniad Glo"],
  "CF64 1AA": ["Main Road"],
  "CF64 1AB": ["School Lane"],
  "CF64 1AD": ["Seaview Avenue"],
  "CF64 1AE": ["Queens Road"],
  "CF64 1AF": ["King Street"],
  "CF64 3PS": ["St Luke's Avenue"],
  "CF64 3PQ": ["St Paul's Avenue"],
  "CF64 3PR": ["St Paul's Avenue"],
  "CF64 3PT": ["St Luke's Avenue"],
  "CF64 3PU": ["St Luke's Avenue"],
  "CF64 4PE": ["Conway Close"]
};



// Haversine formula to calculate distance in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const calculateItemTotal = (item: CartItem) => {
  if (item.manualPrice !== undefined) return item.manualPrice * item.quantity;
  const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
  return (item.price + modifiersTotal) * item.quantity;
};

const CartItemRow = ({ 
  item, 
  onUpdateQuantity, 
  onEditItem, 
  onRemoveItem,
  editingPriceId,
  tempItemPrice,
  setTempItemPrice,
  saveItemPrice
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onEditItem: (item: CartItem) => void;
  onRemoveItem: (id: string) => void;
  editingPriceId: string | null;
  tempItemPrice: string;
  setTempItemPrice: (val: string) => void;
  saveItemPrice: (id: string) => void;
}) => {
  const controls = useAnimation();
  const itemTotal = calculateItemTotal(item);
  const sizeModifiers = item.modifiers.filter(m => isInlineModifier(m.groupId));
  const otherModifiers = item.modifiers.filter(m => !isInlineModifier(m.groupId));
  const displayName = sizeModifiers.map(m => `(${getModifierEmoji(m.name)} ${m.name})`).join(' ');

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped left enough, snap to open state (-120px for two buttons)
    if (info.offset.x < -40) {
      controls.start({ x: -120 });
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
      {/* Background Actions (Revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button 
          onClick={() => onEditItem(item)}
          className="w-[60px] h-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          <Pencil size={18} />
        </button>
        <button 
          onClick={() => onRemoveItem(item.cartId)}
          className="w-[60px] h-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Foreground Item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3 relative z-10"
      >
         {/* Quantity Control */}
         <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg h-8 shrink-0">
            <button 
              onClick={() => onUpdateQuantity(item.cartId, -1)}
              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-l-lg"
            >
              <Minus size={12} strokeWidth={3} />
            </button>
            <span className="font-black text-sm text-slate-800 dark:text-white px-1 w-6 text-center">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.cartId, 1)}
              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors rounded-r-lg"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
         </div>

         {/* Variant Details */}
         <div 
            className="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 rounded transition-colors"
            onClick={() => onEditItem(item)}
         >
            {displayName && (
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    {displayName}
                </div>
            )}
            {otherModifiers.length > 0 ? (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight space-y-0.5 mt-0.5">
                    {Array.from(
                        otherModifiers.reduce((acc, m) => {
                            const key = m.groupId || 'misc';
                            if (!acc.has(key)) acc.set(key, []);
                            acc.get(key)!.push(m);
                            return acc;
                        }, new Map<string, typeof otherModifiers>())
                    ).map(([groupId, mods], idx) => (
                        <div key={idx} className="flex items-start gap-1">
                            <span className="text-slate-400">+</span>
                            <span>{mods.map(m => `(${getModifierEmoji(m.name)} ${m.name})`).join(' ')}</span>
                        </div>
                    ))}
                </div>
            ) : (
                !displayName && !item.instructions && <span className="text-[10px] text-slate-400 italic">Standard</span>
            )}
            {item.instructions && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight mt-1 italic font-medium">
                    Note: {item.instructions}
                </div>
            )}
         </div>

         {/* Price Line */}
         <div className="flex items-center gap-2 text-right">
               {editingPriceId === item.cartId ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">{CURRENCY}</span>
                    <input 
                      autoFocus
                      type="number" 
                      value={tempItemPrice}
                      onChange={(e) => setTempItemPrice(e.target.value)}
                      className="w-14 p-0.5 text-xs font-bold border rounded border-blue-400 outline-none text-right bg-white dark:bg-slate-700 dark:text-white"
                      onKeyDown={(e) => e.key === 'Enter' && saveItemPrice(item.cartId)}
                      onBlur={() => saveItemPrice(item.cartId)}
                    />
                  </div>
               ) : (
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {CURRENCY}{itemTotal.toFixed(2)}
                    {item.manualPrice !== undefined && <span className="text-amber-500 ml-1 text-[9px] uppercase block text-right">(Man)</span>}
                  </div>
               )}
         </div>
      </motion.div>
    </div>
  );
};

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  manualTotal,
  setManualTotal,
  onUpdateQuantity,
  onUpdateItemPrice,
  onRemoveItem,
  onClearCart,
  onEditItem,
  onCheckout,
}) => {
  // Local state for editing the Total Price
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState('');

  // Local state for editing individual Item Price
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempItemPrice, setTempItemPrice] = useState('');

  // Local state for clear cart confirmation
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // --- MODAL STATES ---
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // --- DELIVERY STATE ---
  const [orderType, setOrderType] = useState<OrderType>('Takeaway');
  const [applyDeliveryCharge, setApplyDeliveryCharge] = useState(true);
  
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPostcode, setCustomerPostcode] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); // Street Name etc.
  const [houseNumber, setHouseNumber] = useState(''); // Door Number
  const [distance, setDistance] = useState<number | null>(null);
  const [isSearchingPostcode, setIsSearchingPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);

  // Auto-reset confirmation state after 3 seconds
  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => setIsConfirmingClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingClear) {
      onClearCart();
      setIsConfirmingClear(false);
      // Reset delivery details on clear
      setOrderType('Takeaway');
      setApplyDeliveryCharge(true);
      setCustomerPhone('');
      setCustomerPostcode('');
      setCustomerAddress('');
      setHouseNumber('');
      setDistance(null);
      setPostcodeError(null);
    } else {
      setIsConfirmingClear(true);
    }
  };

  const calculateItemUnitCost = (item: CartItem) => {
    if (item.manualPrice !== undefined) {
      return item.manualPrice;
    }
    const modifiersCost = item.modifiers.reduce((acc, mod) => acc + mod.price, 0);
    return item.price + modifiersCost;
  };

  const calculateItemTotal = (item: CartItem) => {
    return calculateItemUnitCost(item) * item.quantity;
  };

  // Calculated from items
  const calculatedSubtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  // Logic for Delivery Charge
  const currentDeliveryFee = (orderType === 'Delivery' && applyDeliveryCharge) ? DELIVERY_CHARGE : 0;

  // Displayed total is either Manual Override or Calculated (plus delivery if applicable and not overridden)
  // If Manual Total is set, we assume it overrides everything including delivery charge.
  const displayTotal = manualTotal !== null ? manualTotal : (calculatedSubtotal + currentDeliveryFee);

  const saveItemPrice = (cartId: string) => {
    const val = parseFloat(tempItemPrice);
    if (!isNaN(val) && val >= 0) {
      onUpdateItemPrice(cartId, val);
    }
    setEditingPriceId(null);
  };

  // Handle Total Price Edit
  const startEditingTotal = () => {
    setIsEditingTotal(true);
    setTempTotal(displayTotal.toFixed(2));
  };

  const saveTotal = () => {
    const val = parseFloat(tempTotal);
    if (!isNaN(val) && val >= 0) {
      setManualTotal(val);
    } else if (tempTotal === '') {
      setManualTotal(null); // Reset if cleared
    }
    setIsEditingTotal(false);
  };

  const applyDiscount = (percentage: number) => {
    const newTotal = calculatedSubtotal * (1 - percentage);
    setManualTotal(parseFloat(newTotal.toFixed(2)));
    setShowDiscountModal(false);
  };

  const removeDiscount = () => {
    setManualTotal(null);
    setShowDiscountModal(false);
  };

  // Postcode Lookup Logic
  const handlePostcodeLookup = async () => {
    if (!customerPostcode.trim()) return;
    
    // VALIDATION: Only allow CF62, CF63, CF64
    const rawPostcode = customerPostcode.trim().toUpperCase();
    const areaPrefix = rawPostcode.replace(/\s+/g, '').substring(0, 4);
    
    // Check if starts with CF62, CF63 or CF64
    if (!['CF62', 'CF63', 'CF64'].includes(areaPrefix)) {
        setPostcodeError("We only deliver to CF62, CF63, and CF64.");
        setDistance(null);
        setCustomerAddress("");
        return;
    }

    setIsSearchingPostcode(true);
    setPostcodeError(null);
    setDistance(null);

    try {
      // 1. Check distance via postcodes.io
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(customerPostcode)}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const { latitude, longitude, postcode } = data.result;
        
        // Auto-format postcode input
        setCustomerPostcode(postcode);

        const dist = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, latitude, longitude);
        setDistance(dist);

        if (dist > MAX_DELIVERY_MILES) {
          setPostcodeError(`Too far: ${dist.toFixed(1)} miles (Max ${MAX_DELIVERY_MILES}m)`);
        } else {
          
          // Check Local Street Mapping
          const mappedStreets = POSTCODE_STREET_MAPPING[postcode];
          if (mappedStreets && mappedStreets.length > 0) {
             setCustomerAddress(mappedStreets[0]);
          } else {
             // 2. Fetch Street Address via Nominatim if no local map
             try {
                // Using the cleaned postcode for better matching
                const nomResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&addressdetails=1&limit=1`);
                const nomData = await nomResponse.json();

                if (nomData && nomData.length > 0) {
                    const addr = nomData[0].address;
                    
                    // Prioritize street level fields
                    const street = addr.road || addr.street || addr.close || addr.avenue || addr.drive || addr.lane || addr.way || addr.pedestrian || addr.residential || '';
                    const town = addr.town || addr.city || addr.village || addr.suburb || data.result.admin_district || '';
                    
                    if (street) {
                        setCustomerAddress(`${street}, ${town}`);
                    } else {
                        // Fallback to what we had before if no specific street found
                        const locationName = [data.result.parish, data.result.admin_district].filter(Boolean).join(', ');
                        setCustomerAddress(locationName);
                    }
                } else {
                    // Fallback to postcode.io data
                    const locationName = [data.result.parish, data.result.admin_district].filter(Boolean).join(', ');
                    setCustomerAddress(locationName);
                }
             } catch (err) {
                console.warn("Nominatim lookup failed", err);
                const locationName = [data.result.parish, data.result.admin_district].filter(Boolean).join(', ');
                setCustomerAddress(locationName);
             }
          }
        }
      } else {
        setPostcodeError("Invalid Postcode");
      }
    } catch (e) {
      setPostcodeError("Lookup failed");
    } finally {
      setIsSearchingPostcode(false);
    }
  };

  const handleDeliveryClick = () => {
    setOrderType('Delivery');
    setShowDeliveryModal(true);
  };

  const handleDeliveryConfirm = () => {
    if (canCheckout) {
        setShowDeliveryModal(false);
    }
  };

  // Checkout Handler
  const handleCheckoutClick = (method: 'Cash' | 'Card') => {
    // Combine House Number and Street Address
    const finalAddress = houseNumber 
        ? `${houseNumber} ${customerAddress}`
        : customerAddress;

    const customerDetails: CustomerDetails | undefined = orderType === 'Delivery' ? {
        phone: customerPhone,
        postcode: customerPostcode,
        address: finalAddress,
        distance: distance || undefined
    } : undefined;

    // Pass the applyDeliveryCharge flag to checkout
    onCheckout(orderType, customerDetails, method, applyDeliveryCharge);
  };

  const canCheckout = useMemo(() => {
      if (cartItems.length === 0) return false;
      if (orderType === 'Delivery') {
          // Basic validation for delivery
          if (!customerPhone.trim()) return false;
          if (!customerPostcode.trim()) return false;
          if (!customerAddress.trim()) return false;
          if (!houseNumber.trim()) return false; // Require House No
          if (distance !== null && distance > MAX_DELIVERY_MILES) return false;
          if (distance === null && !postcodeError) return false; // Must lookup first
          if (postcodeError) return false;
      }
      return true;
  }, [cartItems, orderType, customerPhone, customerPostcode, customerAddress, houseNumber, distance, postcodeError]);

  // Handle phone input change with formatting and limit
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove non-digits
    const raw = e.target.value.replace(/\D/g, '');
    
    // 2. Limit to 11 digits
    const limited = raw.slice(0, 11);
    
    // 3. Format as 01446 612 164 (5, 3, 3)
    let formatted = limited;
    if (limited.length > 5) {
      formatted = `${limited.slice(0, 5)} ${limited.slice(5)}`;
    }
    if (limited.length > 8) {
      formatted = `${limited.slice(0, 5)} ${limited.slice(5, 8)} ${limited.slice(8)}`;
    }
    
    setCustomerPhone(formatted);
  };

  // Group items by ID to create the "Card per Product" view
  const groupedItems = useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    const order: string[] = []; // To preserve insertion order of the *group*

    cartItems.forEach(item => {
        if (!groups[item.id]) {
            groups[item.id] = [];
            order.push(item.id);
        }
        groups[item.id].push(item);
    });

    return order.map(id => groups[id]);
  }, [cartItems]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
      {/* Compact Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          
          {/* Title & Count */}
          <div className="flex items-center gap-2">
             <div className="bg-blue-50 dark:bg-slate-800 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
               <ShoppingBag className="w-4 h-4" />
             </div>
             <div className="leading-tight">
               <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">Order</h2>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{cartItems.length} Items</p>
             </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-2">
            
            {/* Discount Icon */}
            <button
                onClick={() => setShowDiscountModal(true)}
                className={`p-1.5 rounded-lg transition-all ${manualTotal !== null ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
                title="Apply Discount"
            >
                <Percent size={14} />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

            {/* Toggle Group */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => setOrderType('Takeaway')}
                    title="Takeaway"
                    className={`p-1.5 rounded-md transition-all ${orderType === 'Takeaway' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <ShoppingBag size={14} />
                </button>
                <button
                    onClick={handleDeliveryClick}
                    title="Delivery"
                    className={`p-1.5 rounded-md transition-all ${orderType === 'Delivery' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Truck size={14} />
                </button>
            </div>

            {/* Clear Button */}
            {cartItems.length > 0 && (
                <button 
                  type="button"
                  onClick={handleClearClick}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${isConfirmingClear ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 dark:hover:text-red-400'}`}
                  title="Clear Cart"
                >
                  <Trash2 size={14} />
                </button>
            )}
          </div>
        </div>
      </div>

      {/* ... (Delivery Modal Portal code remains unchanged) ... */}
      {/* ... (Discount Modal Portal code remains unchanged) ... */}
      {showDeliveryModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative z-[10000]">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <Truck size={18} /> Delivery Details
                    </h3>
                    <button onClick={() => setShowDeliveryModal(false)} className="p-1 hover:bg-emerald-200/50 rounded-full text-emerald-700 dark:text-emerald-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="tel"
                                value={customerPhone}
                                onChange={handlePhoneChange}
                                placeholder="01446 612 164"
                                className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Postcode</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    value={customerPostcode}
                                    onChange={(e) => setCustomerPostcode(e.target.value.toUpperCase())}
                                    placeholder="CF62..."
                                    className={`w-full pl-9 pr-3 py-2 text-sm font-bold rounded-xl border focus:border-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white ${postcodeError ? 'border-red-300 bg-red-50' : 'border-slate-200 dark:border-slate-700'}`}
                                />
                            </div>
                            <button 
                                onClick={handlePostcodeLookup}
                                disabled={isSearchingPostcode || !customerPostcode}
                                className="bg-emerald-600 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                {isSearchingPostcode ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Status Message */}
                    {(distance !== null || postcodeError) && (
                        <div className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 ${postcodeError ? 'text-red-600 bg-red-50 border border-red-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'}`}>
                            {postcodeError ? (
                                <><AlertCircle size={14}/> {postcodeError}</>
                            ) : (
                                <><Check size={14}/> {distance?.toFixed(1)} miles away</>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="w-1/3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">House No</label>
                            <input 
                                type="text" 
                                value={houseNumber}
                                onChange={(e) => setHouseNumber(e.target.value)}
                                placeholder="#"
                                className="w-full p-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Street Name</label>
                            <input 
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Road / Street"
                                className="w-full p-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button 
                        onClick={() => { setOrderType('Takeaway'); setShowDeliveryModal(false); }}
                        className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDeliveryConfirm}
                        disabled={!canCheckout}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Discount Modal unchanged */}
      {showDiscountModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs border border-slate-200 dark:border-slate-800 overflow-hidden relative z-[10000]">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center">
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <Percent size={18} /> Apply Discount
                    </h3>
                    <button onClick={() => setShowDiscountModal(false)} className="p-1 hover:bg-purple-200/50 rounded-full text-purple-700 dark:text-purple-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                    <button 
                        onClick={() => applyDiscount(0.10)}
                        className="w-full py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Percent size={16} /> 10% Discount
                    </button>
                    <button 
                        onClick={() => applyDiscount(0.20)}
                        className="w-full py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Percent size={16} /> 20% Discount
                    </button>
                    {manualTotal !== null && (
                        <button 
                            onClick={removeDiscount}
                            className="w-full py-2.5 text-slate-500 hover:text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors mt-2"
                        >
                            <RotateCcw size={14} /> Reset Price
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Items List - Compact Card Style */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-2">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 space-y-3 lg:space-y-4 pb-20">
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
              <Utensils className="text-slate-200 dark:text-slate-600 w-8 h-8 lg:w-10 lg:h-10" />
            </div>
            <p className="text-sm lg:text-lg font-medium text-slate-400 dark:text-slate-600">Start a new order</p>
          </div>
        ) : (
          groupedItems.map((group, groupIdx) => {
            const firstItem = group[0];
            return (
              <div key={`${firstItem.id}-${groupIdx}`} className="flex flex-col gap-2">
                {/* Header for Item Group */}
                <div className="px-2 py-1 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-xl border-b border-slate-100 dark:border-slate-700 mx-1 mt-1">
                   <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide truncate">
                     <span className="mr-1.5">{getCategoryEmoji(firstItem.category)}</span>
                     {firstItem.name}
                   </h4>
                </div>

                {/* Variants List */}
                <div className="space-y-1 px-1">
                  {group.map(item => (
                    <CartItemRow 
                      key={item.cartId}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onEditItem={onEditItem}
                      onRemoveItem={onRemoveItem}
                      editingPriceId={editingPriceId}
                      tempItemPrice={tempItemPrice}
                      setTempItemPrice={setTempItemPrice}
                      saveItemPrice={saveItemPrice}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compact Footer / Checkout */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 shrink-0 p-4">
        
        {/* Delivery Charge Line */}
        {orderType === 'Delivery' && manualTotal === null && (
            <div className="flex justify-between items-center mb-2 px-1">
                <button
                    onClick={() => setApplyDeliveryCharge(!applyDeliveryCharge)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors"
                >
                    <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${applyDeliveryCharge ? 'bg-emerald-600 border-emerald-600' : 'border-emerald-600 bg-transparent'}`}>
                       {applyDeliveryCharge && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <Truck size={12}/> Delivery Charge
                </button>
                <span className={`text-sm font-bold ${applyDeliveryCharge ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 line-through'}`}>
                    {CURRENCY}{DELIVERY_CHARGE.toFixed(2)}
                </span>
            </div>
        )}

        {/* Total Row */}
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</span>
            
            {isEditingTotal ? (
                <div className="flex items-center gap-1">
                    <span className="text-xl text-slate-400 font-bold">{CURRENCY}</span>
                    <input 
                    autoFocus
                    type="number"
                    value={tempTotal}
                    onChange={(e) => setTempTotal(e.target.value)}
                    className="w-28 bg-slate-50 dark:bg-slate-800 border-b-2 border-blue-500 font-black text-2xl text-slate-900 dark:text-white text-right outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && saveTotal()}
                    onBlur={saveTotal}
                    />
                </div>
            ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingTotal} title="Click to Edit Total">
                    <span className={`text-sm font-black leading-none ${manualTotal !== null ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {CURRENCY}{displayTotal.toFixed(2)}
                    </span>
                    {manualTotal !== null && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                </div>
            )}
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleCheckoutClick('Cash')}
              disabled={!canCheckout}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Cash
            </button>
            <button 
              onClick={() => handleCheckoutClick('Card')}
              disabled={!canCheckout}
              className="bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Card <CreditCard size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}
