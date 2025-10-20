// config/api.js
// API konfiguráció a frontend számára

// Backend URL konstansok
const DEV_BACKEND_URL = '';
const PROD_BACKEND_URL = 'https://treasurehunter-mz1x.onrender.com';

// API konfiguráció objektum
export const API_CONFIG = {
  development: {
    baseUrl: DEV_BACKEND_URL
  },
  production: {
    baseUrl: PROD_BACKEND_URL
  }
};

// API URL lekérdezési függvény
export const getApiBaseUrl = () => {
  const mode = import.meta.env.MODE || 'production';
  const config = API_CONFIG[mode] || API_CONFIG.production;
  
  // Ha production módban vagyunk, próbáljuk meg dinamikusan meghatározni
  if (mode === 'production') {
    const currentHost = window.location.hostname;
    
    // Ha a frontend és backend ugyanazon a domain-en van (pl. Render.com)
    if (currentHost.includes('onrender.com')) {
      // Ha a frontend domain tartalmazza a 'frontend' szót, cseréljük le 'backend'-re
      if (currentHost.includes('frontend')) {
        return 'https://' + currentHost.replace('frontend', 'backend');
      }
      // Ha a frontend domain tartalmazza a 'treasurehunter-1' szót, cseréljük le 'treasurehunter-mz1x'-re
      if (currentHost.includes('treasurehunter-1')) {
        return 'https://treasurehunter-mz1x.onrender.com';
      }
    }
  }
  
  return config.baseUrl;
};

// Egyszerű exportok
export const BACKEND_URL = PROD_BACKEND_URL;
export const DEV_URL = DEV_BACKEND_URL;
