import axios from "axios";

const baseURL =
  typeof window === 'undefined'
    ? process.env.API_URL + 'api/'           // SSR : réseau Docker interne
    : process.env.NEXT_PUBLIC_API_URL + 'api/'; // Client : localhost

const api = axios.create({
    baseURL,
});

export default api
