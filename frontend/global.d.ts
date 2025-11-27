declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      API_URL?: string;
      // ajoute d'autres clés si nécessaire
    };
  }
}

export {};