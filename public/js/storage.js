const KEYS = {
  user: "boardscout:user",
  preferences: "boardscout:preferences",
  favorites: "boardscout:favorites",
};

// 손상된 저장값이나 최초 방문 상태에서도 화면이 멈추지 않도록 기본값으로 복구합니다.
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// 백엔드가 준비되지 않은 환경에서도 인증·취향·저장 흐름을 체험할 수 있는 로컬 저장소입니다.
export const localSession = {
  getUser: () => read(KEYS.user, null),
  setUser: (user) => write(KEYS.user, user),
  clearUser: () => localStorage.removeItem(KEYS.user),
  getPreferences: () => read(KEYS.preferences, null),
  setPreferences: (preferences) => write(KEYS.preferences, preferences),
  getFavorites: () => read(KEYS.favorites, []),
  setFavorites: (favorites) => write(KEYS.favorites, favorites),
};
