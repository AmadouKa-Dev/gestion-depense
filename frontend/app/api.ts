import axios from "axios";

const baseURL =
  typeof window === 'undefined'
    ? process.env.API_URL + 'api/'           // SSR : réseau Docker interne
    : window.RUNTIME_CONFIG?.API_URL + 'api/'; // Client : localhost

const api = axios.create({
    baseURL,
});

export default api
