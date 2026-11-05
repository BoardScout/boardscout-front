const KEYS = {
  user: "boardscout:user",
  preferences: "boardscout:preferences",
  favorites: "boardscout:favorites",
};

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const localSession = {
  getUser: () => read(KEYS.user, null),
  setUser: (user) => write(KEYS.user, user),
  clearUser: () => localStorage.removeItem(KEYS.user),
  getPreferences: () => read(KEYS.preferences, null),
  setPreferences: (preferences) => write(KEYS.preferences, preferences),
  getFavorites: () => read(KEYS.favorites, []),
  setFavorites: (favorites) => write(KEYS.favorites, favorites),
};
