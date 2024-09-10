// Helper functions for localStorage
export const loadFromLocalStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error parsing localStorage for key ${key}:`, error);
    }
  }
  return defaultValue;
};

export const saveToLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};