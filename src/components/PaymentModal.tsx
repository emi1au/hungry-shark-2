
import React, { useState, useEffect } from 'react';
import { CURRENCY } from '../constants';
import { PrinterDevice, CartItem, CustomerDetails, OrderType } from '../types';
import { searchForPrinters } from '../services/printerService';
import { X, CreditCard, Banknote, Printer, Check, ArrowRight, Smartphone, FileText, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  cartItems: CartItem[]; // Required to persist state during app switch
  orderDetails: { type: OrderType; customer?: CustomerDetails }; // Required to persist state
  onClose: () => void;
  onConfirm: (method: 'Cash' | 'Card', tendered: number, change: number) => void;
  connectedPrinter: PrinterDevice | null;
  setConnectedPrinter: (printer: PrinterDevice | null) => void;
  initialPaymentMethod?: 'Cash' | 'Card';
  onPrintPreview: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  total, 
  cartItems,
  orderDetails,
  onClose, 
  onConfirm,
  connectedPrinter,
  setConnectedPrinter,
  initialPaymentMethod = 'Card',
  onPrintPreview
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Card');
  const [amountTendered, setAmountTendered] = useState<string>('');
  
  // Printer State
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  const [showPrinterSelect, setShowPrinterSelect] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(initialPaymentMethod);
      setAmountTendered('');
      setShowPrinterSelect(false);
    }
  }, [isOpen, initialPaymentMethod]);

  if (!isOpen) return null;

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);
  const isCashSufficient = tenderedNum >= total;
  const nextRoundUp = Math.ceil(total);
  const nextFive = Math.ceil(total / 5) * 5;
  const nextTen = Math.ceil(total / 10) * 10;

  const dynamicQuickAmounts = Array.from(new Set([
    total, // Exact
    nextRoundUp !== total ? nextRoundUp : null,
    nextFive !== total ? nextFive : null,
    nextTen !== total ? nextTen : null,
    20, 50
  ].filter((n): n is number => n !== null && n >= total))).sort((a, b) => a - b).slice(0, 4);

  const handlePrinterScan = async () => {
    setAvailablePrinters([]);
    const printers = await searchForPrinters();
    setAvailablePrinters(printers);
  };

  const handleConnectPrinter = (printer: PrinterDevice) => {
    setConnectedPrinter({ ...printer, status: 'connected' });
    setShowPrinterSelect(false);
  };

  const handleQuickSunmiConnect = () => {
    setConnectedPrinter({
        id: 'net_127.0.0.1_9100',
        name: 'Sunmi Internal Printer',
        type: 'network',
        status: 'connected',
        ipAddress: '127.0.0.1',
        port: '9100'
    });
    setShowPrinterSelect(false);
  };

  const handleFinalize = async () => {
    if (paymentMethod === 'Cash') {
      if (!isCashSufficient) return;
      onConfirm('Cash', tenderedNum, changeDue);
    } else {
      // Card logic (Manual/External Terminal)
      onConfirm('Card', total, 0);
    }
  };

  const handleNumpadInput = (val: string) => {
    if (val === 'backspace') {
      setAmountTendered(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amountTendered.includes('.')) setAmountTendered(prev => prev + '.');
    } else if (val === 'clear') {
      setAmountTendered('');
    } else {
      // Prevent too many decimals
      if (amountTendered.includes('.') && amountTendered.split('.')[1].length >= 2) return;
      setAmountTendered(prev => prev + val);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-2 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col lg:flex-row overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Summary (Left on Desktop, Top on Mobile) */}
        <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 p-4 lg:p-8 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex justify-between items-center mb-4 lg:mb-6">
               <h2 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white">Summary</h2>
               <button onClick={onClose} className="lg:hidden p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-white">
                 <X size={16} />
               </button>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div className="p-4 lg:p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                 <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Total Due</p>
                 <p className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white">{CURRENCY}{total.toFixed(2)}</p>
              </div>

              {/* Printer Status */}
              <div className="p-3 lg:p-4 bg-slate-900 dark:bg-black rounded-xl text-white shadow-lg">
                 <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                     <Printer size={16} className={connectedPrinter ? "text-green-400" : "text-slate-400"} />
                     <span className="font-bold text-xs lg:text-sm">Printer</span>
                   </div>
                   <button 
                     onClick={() => { setShowPrinterSelect(!showPrinterSelect); if(!showPrinterSelect) handlePrinterScan(); }}
                     className="text-[10px] lg:text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 lg:px-3 lg:py-1.5 rounded transition-colors"
                   >
                     {connectedPrinter ? 'Change' : 'Select'}
                   </button>
                 </div>
                 <p className="text-[10px] lg:text-xs text-slate-400 truncate">
                   {connectedPrinter ? `Connected: ${connectedPrinter.name}` : 'No printer selected.'}
                 </p>

                 {!connectedPrinter && (
                   <button 
                    onClick={handleQuickSunmiConnect}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors"
                   >
                     <Smartphone size={12} /> Connect Sunmi
                   </button>
                 )}

                 {showPrinterSelect && (
                   <div className="mt-2 pt-2 border-t border-slate-700 animate-in slide-in-from-top-2">
                      <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                        {availablePrinters.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => handleConnectPrinter(p)}
                            className="w-full text-left text-[10px] p-1.5 rounded hover:bg-slate-700 flex justify-between items-center"
                          >
                            <span>{p.name}</span>
                            {connectedPrinter?.id === p.id && <Check size={12} className="text-green-400" />}
                          </button>
                        ))}
                      </div>
                   </div>
                 )}
              </div>

              {/* Print Preview Button */}
              <button 
                 onClick={onPrintPreview}
                 className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                 <FileText size={18} /> Receipt Preview
              </button>
            </div>
          </div>

          <button onClick={onClose} className="hidden lg:block text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">
             Cancel Payment
          </button>
        </div>

        {/* Interaction (Right on Desktop, Bottom on Mobile) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-h-0">
           
           {/* Method Tabs */}
           <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
             <button 
               onClick={() => setPaymentMethod('Card')}
               className={`flex-1 py-3 lg:py-6 flex items-center justify-center gap-2 lg:gap-3 text-sm lg:text-lg font-bold transition-all ${paymentMethod === 'Card' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-4 border-blue-600 dark:border-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             >
               <CreditCard className="w-4 h-4 lg:w-6 lg:h-6" />
               Card
             </button>
             <button 
               onClick={() => setPaymentMethod('Cash')}
               className={`flex-1 py-3 lg:py-6 flex items-center justify-center gap-2 lg:gap-3 text-sm lg:text-lg font-bold transition-all ${paymentMethod === 'Cash' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-b-4 border-emerald-600 dark:border-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             >
               <Banknote className="w-4 h-4 lg:w-6 lg:h-6" />
               Cash
             </button>
           </div>

           {/* Content Area */}
           <div className="flex-1 p-3 lg:p-8 flex flex-col overflow-y-auto">
              
              {paymentMethod === 'Card' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 lg:space-y-6">
                  <div className="w-24 h-24 lg:w-48 lg:h-48 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                    <CreditCard className="w-10 h-10 lg:w-20 lg:h-20 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white">Waiting for Terminal...</h3>
                    <p className="text-xs lg:text-base text-slate-500 dark:text-slate-400 mt-1 lg:mt-2">Please ask customer to tap, insert, or swipe.</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 w-full max-w-md mx-auto">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-500" /> Manual Terminal Entry
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Simply type <strong>{CURRENCY}{total.toFixed(2)}</strong> into your card reader manually. Once the payment is approved, click the big <strong>Finalize Payment</strong> button below to print the receipt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'Cash' && (
                <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-8 h-full">
                   {/* Calculator / Numpad Side */}
                   <div className="flex-1 flex flex-col gap-2 lg:gap-4 h-full">
                      {/* Display */}
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-2 lg:p-4 text-right border-2 border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
                         <span className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1">Amount Tendered</span>
                         <div className="text-2xl lg:text-4xl font-mono font-bold text-slate-800 dark:text-white flex justify-end items-center h-8 lg:h-12">
                           <span className="text-slate-400 mr-2">{CURRENCY}</span>
                           {amountTendered || '0.00'}
                         </div>
                      </div>

                      {/* Numpad */}
                      <div className="grid grid-cols-3 gap-2 lg:gap-3 flex-1 min-h-[200px] lg:min-h-0">
                        {[1,2,3,4,5,6,7,8,9,'.',0,'backspace'].map((key) => (
                          <button
                            key={key}
                            onClick={() => handleNumpadInput(key.toString())}
                            className={`rounded-xl text-lg lg:text-2xl font-bold transition-all active:scale-95 ${
                               key === 'backspace' 
                               ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50' 
                               : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm'
                            }`}
                          >
                            {key === 'backspace' ? '⌫' : key}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Quick Amounts & Change Side */}
                   <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 lg:gap-4 shrink-0">
                      <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 lg:gap-3 flex-1 lg:flex-none">
                         {dynamicQuickAmounts.map(amt => (
                           <button
                             key={amt}
                             onClick={() => setAmountTendered(amt.toString())}
                             className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 py-2 lg:py-3 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-xs lg:text-base"
                           >
                             {CURRENCY}{amt.toFixed(2)}
                           </button>
                         ))}
                      </div>

                      <div className="flex-1 lg:flex-none lg:mt-auto bg-slate-900 dark:bg-black rounded-xl lg:rounded-2xl p-3 lg:p-6 text-white shadow-xl flex flex-col justify-center">
                        <p className="text-[10px] lg:text-sm opacity-60 font-medium uppercase tracking-wider mb-0.5 lg:mb-2">Change Due</p>
                        <div className={`text-2xl lg:text-5xl font-bold mb-1 transition-colors ${changeDue < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {CURRENCY}{changeDue.toFixed(2)}
                        </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Footer Action */}
           <div className="p-3 lg:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
             <button
               onClick={handleFinalize}
               disabled={paymentMethod === 'Cash' && !isCashSufficient}
               className={`w-full py-3 lg:py-4 rounded-xl text-base lg:text-xl font-bold shadow-lg flex items-center justify-center gap-2 lg:gap-3 transition-all active:scale-[0.98] ${
                 paymentMethod === 'Cash' && !isCashSufficient
                   ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                   : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none'
               }`}
             >
               <span>Finalize Payment</span>
               <ArrowRight size={20} className="lg:w-6 lg:h-6" />
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};
