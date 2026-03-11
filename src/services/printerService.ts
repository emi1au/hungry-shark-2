
import { PrinterDevice } from '../types';

// Mock simulation of Web Bluetooth / Network Printer discovery
export const searchForPrinters = async (): Promise<PrinterDevice[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'p1', name: 'Star Micronics TSP100', type: 'bluetooth', status: 'disconnected' },
        { id: 'p2', name: 'Sunmi Internal Printer', type: 'network', status: 'disconnected', ipAddress: '127.0.0.1', port: '9100' },
        { id: 'p3', name: 'Generic POS Printer', type: 'bluetooth', status: 'disconnected' },
      ]);
    }, 1500); // Simulate scanning delay
  });
};

export const connectToPrinter = async (printerId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Connected to printer ${printerId}`);
      resolve(true);
    }, 500);
  });
};

export const connectToNetworkPrinter = async (ip: string, port: string): Promise<PrinterDevice> => {
  if (ip === '127.0.0.1' || ip === 'localhost') {
    return {
        id: `net_${ip}_${port}`,
        name: 'Sunmi / Local Printer',
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    await fetch(`http://${ip}:${port}/`, { 
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors' 
    });
    
    clearTimeout(timeoutId);
    
    return {
        id: `net_${ip}_${port}`,
        name: `Network Printer (${ip})`,
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  } catch (e) {
    console.error("Printer connection check failed:", e);
    return {
        id: `net_${ip}_${port}`,
        name: `Network Printer (${ip})`,
        type: 'network',
        status: 'connected',
        ipAddress: ip,
        port: port
    };
  }
};

export const openCashDrawer = async (printer: PrinterDevice) => {
  const ESC_KICK = '\x1B\x70\x00\x19\xFA'; // ESC p 0 25 250
  
  if (printer.type === 'network' && printer.ipAddress) {
    return printReceiptData(printer, ESC_KICK);
  } else {
    console.log(`🖨️ SENDING BLUETOOTH COMMAND TO ${printer.name}: ESC p 0 50 250`);
  }
  return true;
};

// Helper to send data via RawBT Android Intent (Bypasses Browser Security)
const sendRawbtIntent = (data: string) => {
    try {
        // 1. Handle Currency (Swap £ for PC850 pound symbol \x9c)
        let processedData = data.replace(/£/g, '\x9c');

        // 2. Ensure Binary Safety for btoa (Latin1 Only)
        // JavaScript strings are UTF-16. btoa expects each char to be 0-255.
        // We map any char > 255 to '?' to prevent btoa error.
        // This preserves ESC/POS bytes like \xFA (250) which are needed for drawer kick.
        const binaryString = Array.from(processedData, (char) => 
            char.charCodeAt(0) > 255 ? '?' : char
        ).join('');

        const base64 = btoa(binaryString);
        
        // 3. Construct the Intent URL
        // UPDATED: Included BOTH S.cut=true (String) and B.cut=true (Boolean)
        // This maximizes compatibility across different RawBT versions and browsers (like Firefox).
        const intentUrl = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.jobName=HungrySharkReceipt;S.cut=true;B.cut=true;end;`;
        
        // 4. Trigger via Anchor Click
        const a = document.createElement('a');
        a.href = intentUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup after a small delay
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);

        return true;
    } catch (err) {
        console.error("RawBT Intent failed", err);
        return false;
    }
};

export const printReceiptData = async (printer: PrinterDevice, data: string) => {
  console.log(`🖨️ PRINTING TO ${printer.name}...`);
  
  if (printer.type === 'network' && printer.ipAddress) {
     const isLocalhost = printer.ipAddress === '127.0.0.1' || printer.ipAddress === 'localhost';

     if (isLocalhost) {
         // Direct Intent for Localhost/Sunmi
         return sendRawbtIntent(data);
     }

     try {
         await fetch(`http://${printer.ipAddress}:${printer.port}/`, {
             method: 'POST',
             body: data,
             mode: 'no-cors'
         });
         return true;
     } catch (e) {
         console.warn("Direct print failed, trying fallback...", e);
         return sendRawbtIntent(data);
     }
  }
  
  return true;
};
