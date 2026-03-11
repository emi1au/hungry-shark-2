
import { Order } from '../types';

const SYNC_URL_KEY = 'hs_sync_url';
const SYNC_API_KEY = 'hs_sync_api_key';
const ORDERS_KEY = 'hs_orders';

// Provided credentials
const DEFAULT_SYNC_URL = 'https://api.jsonbin.io/v3/b/69556c3043b1c97be9110766';
// NOTE: Prepending standard bcrypt $2b$ prefix as provided key 10$ is incomplete for JSONBin
const DEFAULT_API_KEY = '$2b$10$QEq67YPwYpMYQpDW4HPvZOuL/FCI6vE58ou2z8QpxTPqijwOg9q1K'; 

export const getSyncConfig = () => {
  return {
    url: localStorage.getItem(SYNC_URL_KEY) || DEFAULT_SYNC_URL,
    apiKey: localStorage.getItem(SYNC_API_KEY) || DEFAULT_API_KEY
  };
};

export const setSyncConfig = (url: string, apiKey: string) => {
  localStorage.setItem(SYNC_URL_KEY, url);
  localStorage.setItem(SYNC_API_KEY, apiKey);
};

export const fetchOrders = async (): Promise<Order[]> => {
  const { url, apiKey } = getSyncConfig();
  
  // 1. Try Remote Fetch if configured
  if (url && apiKey) {
    try {
      // Add a timeout signal so we don't wait forever if offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      // Force fresh fetch by appending timestamp (Bypasses WebView cache)
      const separator = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${separator}ts=${Date.now()}`;

      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'X-Master-Key': apiKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        // Support JSONBin v3 (data.record.orders) or generic (data.orders)
        const remoteOrders = data.record?.orders || data.orders || [];
        
        if (Array.isArray(remoteOrders)) {
            const parsed = remoteOrders.map((o: any) => ({
                ...o,
                date: new Date(o.date)
            }));
            // Update local cache
            localStorage.setItem(ORDERS_KEY, JSON.stringify(parsed));
            return parsed;
        }
      }
    } catch (e) {
      // Use logic flow control, not console warn for standard offline behavior
      // Fail silently to local storage
    }
  }

  // 2. Fallback to Local Storage
  try {
    const local = localStorage.getItem(ORDERS_KEY);
    if (local) {
      return JSON.parse(local).map((o: any) => ({
          ...o,
          date: new Date(o.date)
      }));
    }
  } catch(e) {}
  
  return [];
};

export const saveOrders = async (orders: Order[]): Promise<boolean> => {
  const { url, apiKey } = getSyncConfig();
  
  // Always save local first for speed/offline safety
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Local Save Error (Storage Full?)", e);
  }

  // Push to Remote (Fire and forget, don't block UI)
  if (url && apiKey) {
    // We don't await this so the UI feels instant
    fetch(url, {
      method: 'PUT',
      headers: {
        'X-Master-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orders })
    }).catch(_e => {
        // Just log, don't crash. We are likely offline.
        console.log("Offline mode: Saved locally only.");
    });
  }
  return true;
};
