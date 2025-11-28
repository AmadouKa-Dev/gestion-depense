declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      API_URL?: string;
      // Optionnel mais pour que typescript comprenne sans mettre des warnings
    };
  }
}

export {};