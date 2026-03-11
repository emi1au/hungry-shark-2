import React from 'react';
import { CartItem, OrderType } from '../types';
import { Trash2, ShoppingBag, Bike, CreditCard } from 'lucide-react';
import { getCategoryEmoji, getModifierEmoji } from '../constants';

interface CartProps {
  items: CartItem[];
  orderType: OrderType;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onToggleOrderType: (type: OrderType) => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ 
  items, 
  orderType, 
  onUpdateQuantity, 
  onRemoveItem, 
  onToggleOrderType,
  onCheckout 
}) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.price + item.modifiers.reduce((acc, mod) => acc + mod.price, 0)) * item.quantity;
    return sum + itemTotal;
  }, 0);

  const deliveryFee = orderType === 'Delivery' ? 2.00 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-full max-w-md">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
          Current Order
        </h2>
        
        {/* Order Type Toggle */}
        <div className="flex bg-slate-200 p-1 rounded-lg mt-4">
          <button
            onClick={() => onToggleOrderType('Takeaway')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              orderType === 'Takeaway' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Takeaway
          </button>
          <button
            onClick={() => onToggleOrderType('Delivery')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              orderType === 'Delivery' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Bike className="w-4 h-4" />
            Delivery
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <ShoppingBag className="w-16 h-16 opacity-20" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.cartId} className="bg-slate-50 rounded-xl p-4 border border-slate-100 group hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800">
                  <span className="mr-1.5">{getCategoryEmoji(item.category)}</span>
                  {item.name}
                </h3>
                <span className="font-mono font-medium text-slate-600">
                  £{((item.price + item.modifiers.reduce((acc, mod) => acc + mod.price, 0)) * item.quantity).toFixed(2)}
                </span>
              </div>
              
              {/* Modifiers */}
              {item.modifiers.length > 0 && (
                <div className="text-xs text-slate-500 mb-3 space-y-1">
                  {item.modifiers.map((mod, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>+ {getModifierEmoji(mod.name)} {mod.name}</span>
                      {mod.price > 0 && <span>£{mod.price.toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => onUpdateQuantity(item.cartId, -1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-l-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-medium text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.cartId, 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-r-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={() => onRemoveItem(item.cartId)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {orderType === 'Delivery' && (
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>£{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg flex justify-between items-center transition-all active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout
          </span>
          <span>£{total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};
