import axios from "axios";

const getBaseURL = (): string => {
  // Côté client (navigateur)
  if (typeof window !== 'undefined') {
    // 1. Priorité : URL depuis runtime-config.js (injectée par K8s ConfigMap)
    const runtimeUrl = window.RUNTIME_CONFIG?.API_URL;
    
    if (runtimeUrl && runtimeUrl !== '' && runtimeUrl !== 'placeholder') {
      return runtimeUrl;
    }
    
    // 2. Fallback : utilise l'origine actuelle (auto-détection)
    return window.location.origin;
  }
  
  // Côté serveur (SSR/Server Components)
  const serverUrl = process.env.API_URL || 'http://backend-service:8000';
  console.log('🔧 SSR using API_URL:', serverUrl);
  return serverUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Intercepteur qui met à jour l'URL à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG?.API_URL) {
    const runtimeUrl = window.RUNTIME_CONFIG.API_URL;
    config.baseURL = runtimeUrl.endsWith('/') ? `${runtimeUrl}api/` : `${runtimeUrl}/api/`;
  }
  return config;
});

export default api
