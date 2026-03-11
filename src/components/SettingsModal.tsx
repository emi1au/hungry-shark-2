
import React, { useState, useEffect } from 'react';
import { PrinterDevice } from '../types';
import { connectToNetworkPrinter, printReceiptData } from '../services/printerService';
import { getSyncConfig, setSyncConfig } from '../services/storageService';
import { X, Printer, Monitor, Settings as SettingsIcon, Server, Smartphone, Info, PlayCircle, Cloud, Save, Database, Loader2, Plus } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedPrinter: PrinterDevice | null;
  setConnectedPrinter: (printer: PrinterDevice | null) => void;
  tillName: string;
  setTillName: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  connectedPrinter,
  setConnectedPrinter,
  tillName,
  setTillName
}) => {
  const [activeTab, setActiveTab] = useState<'printer' | 'sync'>('printer');
  
  const [manualIp, setManualIp] = useState('127.0.0.1');
  const [manualPort, setManualPort] = useState('9100');
  const [isConnectingManual, setIsConnectingManual] = useState(false);

  // Sync State
  const [syncUrl, setSyncUrl] = useState('');
  const [syncApiKey, setSyncApiKey] = useState('');
  const [isCreatingBin, setIsCreatingBin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSyncConfig();
      setSyncUrl(config.url);
      setSyncApiKey(config.apiKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- PRINTER HANDLERS ---
  const handleManualConnect = async () => {
    if (!manualIp) return;
    setIsConnectingManual(true);
    try {
      const printer = await connectToNetworkPrinter(manualIp, manualPort);
      setConnectedPrinter(printer);
    } catch (e) {
      setConnectedPrinter({
        id: `net_${manualIp}_${manualPort}`,
        name: 'Sunmi / RawBT (Fallback)',
        type: 'network',
        status: 'connected',
        ipAddress: manualIp,
        port: manualPort
      });
    } finally {
      setIsConnectingManual(false);
    }
  };

  const handleSunmiOneClick = () => {
    setManualIp('127.0.0.1');
    setManualPort('9100');
    setConnectedPrinter({
        id: 'net_127.0.0.1_9100',
        name: 'Sunmi Internal Printer',
        type: 'network',
        status: 'connected',
        ipAddress: '127.0.0.1',
        port: '9100'
    });
  };

  const handleDisconnect = () => {
    setConnectedPrinter(null);
  };

  const handleTestPrint = async () => {
    if (!connectedPrinter) return;
    const testContent = `
    HUNGRY SHARK POS
    Test Print
    --------------------------------
    Printer: ${connectedPrinter.name}
    IP: ${connectedPrinter.ipAddress}
    
    Configuration Successful!
    --------------------------------
    \n\n\n\x1d\x56\x42\x00`;
    await printReceiptData(connectedPrinter, testContent);
  };

  // --- SYNC HANDLERS ---
  const handleSaveSync = () => {
    setSyncConfig(syncUrl, syncApiKey);
    alert("Sync settings saved! The app will now try to fetch orders from this URL.");
  };

  const handleCreateBin = async () => {
    if (!syncApiKey) {
        alert("Please enter your API Key first.");
        return;
    }
    
    setIsCreatingBin(true);
    try {
        const res = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': syncApiKey,
                'X-Bin-Name': 'Hungry Shark Orders' 
            },
            body: JSON.stringify({ orders: [] })
        });

        if (res.ok) {
            const data = await res.json();
            const binId = data.metadata?.id;
            if (binId) {
                const newUrl = `https://api.jsonbin.io/v3/b/${binId}`;
                setSyncUrl(newUrl);
                alert("Success! New Bin created. Click 'Save Configuration' to finish.");
            } else {
                alert("Created, but could not retrieve Bin ID.");
            }
        } else {
            const err = await res.json();
            alert(`Failed: ${err.message || 'Unknown error'}`);
        }
    } catch (e) {
        alert("Network error while creating bin.");
    } finally {
        setIsCreatingBin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-black text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-slate-700 p-2 rounded-lg">
               <SettingsIcon size={24} className="text-white" />
             </div>
             <div>
               <h2 className="text-xl font-bold">Station Settings</h2>
               <p className="text-slate-400 text-sm">Hardware & Cloud Config</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-black shrink-0">
          <button 
            onClick={() => setActiveTab('printer')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'printer' ? 'bg-white dark:bg-neutral-900 border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
          >
            <Printer size={18} />
            Hardware & Till
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'sync' ? 'bg-white dark:bg-neutral-900 border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
          >
            <Cloud size={18} />
            Cloud Sync
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-black">
          
          {/* === PRINTER TAB === */}
          {activeTab === 'printer' && (
            <div className="space-y-6">
                {/* Till Config */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-white border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <Monitor className="text-blue-600" size={20} />
                    <h3 className="font-bold text-lg">Till Identity</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1">Station Name</label>
                            <input 
                            type="text" 
                            value={tillName}
                            onChange={(e) => setTillName(e.target.value)}
                            placeholder="e.g. Counter 1"
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Printer Config */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                            <Printer className="text-emerald-600" size={20} />
                            <h3 className="font-bold text-lg">Receipt Printer</h3>
                        </div>
                        {connectedPrinter && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
                            </span>
                        )}
                    </div>

                    {!connectedPrinter && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                            <div className="flex gap-4 items-start">
                                <div className="bg-blue-100 dark:bg-blue-900 p-2.5 rounded-xl text-blue-700 dark:text-blue-300 mt-1 shrink-0">
                                    <Smartphone size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">RawBT / Sunmi Setup</h4>
                                    <p className="text-sm text-slate-600 dark:text-neutral-300 mb-3">One-click setup for Sunmi devices or Android RawBT.</p>
                                    <button onClick={handleSunmiOneClick} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition-all">
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        One-Click Connect (Localhost)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connected Status */}
                    {connectedPrinter ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center"><Printer size={20} /></div>
                                <div>
                                <p className="font-bold text-emerald-900 dark:text-emerald-100">{connectedPrinter.name}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1">{connectedPrinter.type} {connectedPrinter.ipAddress}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleTestPrint} className="text-xs font-bold bg-white dark:bg-neutral-800 text-emerald-600 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-neutral-700 px-3 py-2 rounded-lg flex items-center gap-1"><PlayCircle size={14} /> Test</button>
                                <button onClick={handleDisconnect} className="text-xs font-bold text-red-500 hover:bg-white dark:hover:bg-neutral-800 px-3 py-2 rounded-lg">Disconnect</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-neutral-700 mb-6">
                            <p className="text-slate-500 dark:text-neutral-400 font-medium mb-1">No printer connected</p>
                        </div>
                    )}

                    {/* Advanced Manual Config */}
                    <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-700">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-slate-700 dark:text-neutral-300 uppercase flex items-center gap-2"><Server size={16}/> Manual Network Config</h4>
                        </div>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mb-1">IP Address</label>
                                <input type="text" value={manualIp} onChange={(e) => setManualIp(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-black text-slate-900 dark:text-white text-sm font-mono" />
                            </div>
                            <div className="w-24">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mb-1">Port</label>
                                <input type="text" value={manualPort} onChange={(e) => setManualPort(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-black text-slate-900 dark:text-white text-sm font-mono" />
                            </div>
                            <button onClick={handleManualConnect} disabled={isConnectingManual || !!connectedPrinter} className="bg-slate-600 text-white h-[38px] px-4 rounded-lg font-bold text-sm hover:bg-slate-700 disabled:opacity-50">{isConnectingManual ? '...' : 'Connect'}</button>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* === SYNC TAB === */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-white border-b border-slate-100 dark:border-neutral-800 pb-3">
                        <Database className="text-emerald-600" size={20} />
                        <div>
                            <h3 className="font-bold text-lg">Cloud Synchronization</h3>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 font-normal">Sync order numbers across multiple devices</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
                        <p className="font-bold mb-1 flex items-center gap-2"><Info size={16}/> Setup Instructions:</p>
                        <ul className="list-disc list-inside space-y-1 opacity-90 text-xs md:text-sm">
                            <li>1. Enter your JSONBin.io <b>API Key</b> below.</li>
                            <li>2. Click <b>Auto-Create New Bin</b> to generate a URL.</li>
                            <li>3. Click <b>Save</b>.</li>
                            <li>4. On the <b>2nd Computer</b>, enter the EXACT same URL and Key.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1">API Key / Access Token</label>
                            <input 
                                type="text" 
                                value={syncApiKey}
                                onChange={(e) => setSyncApiKey(e.target.value)}
                                placeholder="e.g. $2b$10$..."
                                className="w-full p-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1">JSON Storage URL (Bin ID)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={syncUrl}
                                    onChange={(e) => setSyncUrl(e.target.value)}
                                    placeholder="e.g. https://api.jsonbin.io/v3/b/..."
                                    className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                                />
                                <button 
                                    onClick={handleCreateBin}
                                    disabled={isCreatingBin || !syncApiKey}
                                    className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 px-3 py-2 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    title="Generate new Bin from Key"
                                >
                                    {isCreatingBin ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16} />}
                                    <span className="hidden sm:inline">Auto-Create</span>
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSaveSync}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <Save size={18} />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-black flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
