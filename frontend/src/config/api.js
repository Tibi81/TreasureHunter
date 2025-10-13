// config/api.js
// API konfiguráció a frontend számára

// Backend URL konstansok - explicit string literálok
const DEV_BACKEND_URL = 'http://127.0.0.1:8000';
const PROD_BACKEND_URL = 'https://treasurehunter-mz1x.onrender.com';

// Debug log a build számára
console.log('🔍 DEV_BACKEND_URL:', DEV_BACKEND_URL);
console.log('🔍 PROD_BACKEND_URL:', PROD_BACKEND_URL);

// Explicit backend URL exportálása a build számára
export const BACKEND_URL = PROD_BACKEND_URL;
export const DEV_URL = DEV_BACKEND_URL;

// API konfiguráció objektum
export const API_CONFIG = {
  // Fejlesztési környezet
  development: {
    baseUrl: DEV_BACKEND_URL
  },
  
  // Production környezet
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
    }
  }
  
  return config.baseUrl;
};

// Explicit backend URL exportálása a build számára
export const BACKEND_URL_ALT = PROD_BACKEND_URL;
export const DEV_URL_ALT = DEV_BACKEND_URL;

// További explicit exportok a build számára
export const PROD_URL = 'https://treasurehunter-mz1x.onrender.com';
export const DEV_URL_ALT2 = 'http://127.0.0.1:8000';

// További explicit exportok a build számára
export const BACKEND_URL_ALT2 = 'https://treasurehunter-mz1x.onrender.com';
export const DEV_URL_ALT3 = 'http://127.0.0.1:8000';

// További explicit exportok a build számára
export const BACKEND_URL_ALT3 = 'https://treasurehunter-mz1x.onrender.com';
export const DEV_URL_ALT4 = 'http://127.0.0.1:8000';

// További explicit exportok a build számára
export const BACKEND_URL_ALT4 = 'https://treasurehunter-mz1x.onrender.com';
export const DEV_URL_ALT5 = 'http://127.0.0.1:8000';
