import axios from "axios";

const getBaseURL = (): string => {
  // Côté serveur (SSR)
  if (typeof window === 'undefined') {
    const serverUrl = process.env.API_URL || 'http://backend:8000/';
    return serverUrl.endsWith('/') ? `${serverUrl}api/` : `${serverUrl}/api/`;
  }
  
  // Côté client - utilise runtime config en priorité
  const clientUrl = window.RUNTIME_CONFIG?.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/';
  
  console.log('🔧 Client API URL:', clientUrl); // Debug
  
  return clientUrl.endsWith('/') ? `${clientUrl}api/` : `${clientUrl}/api/`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Intercepteur qui met à jour l'URL à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG?.API_URL) {
    const runtimeUrl = window.RUNTIME_CONFIG.API_URL;
    const baseURL = runtimeUrl.endsWith('/') ? `${runtimeUrl}api/` : `${runtimeUrl}/api/`;
    config.baseURL = baseURL;
    console.log('🔧 Using runtime baseURL:', baseURL);
  }
  return config;
});

export default api
