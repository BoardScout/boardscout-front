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

// 브라우저 저장소입니다. 사용자·취향·관심 목록 모두 서버가 기준이고,
// 여기에는 서버에 닿지 못할 때 화면을 그리기 위한 마지막 사본만 둡니다.
export const localSession = {
  getUser: () => read(KEYS.user, null),
  setUser: (user) => write(KEYS.user, user),
  clearUser: () => localStorage.removeItem(KEYS.user),
  getPreferences: () => read(KEYS.preferences, null),
  setPreferences: (preferences) => write(KEYS.preferences, preferences),
  getFavorites: () => read(KEYS.favorites, []),
  setFavorites: (favorites) => write(KEYS.favorites, favorites),
};
