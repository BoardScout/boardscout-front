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
// 값을 JSON 문자열로 바꿔 localStorage에 저장합니다.
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// 백엔드가 준비되지 않은 환경에서도 인증·취향·저장 흐름을 체험할 수 있는 로컬 저장소입니다.
export const localSession = {
  // 로그인한 사용자 정보를 읽습니다. 없으면 null입니다.
  getUser: () => read(KEYS.user, null),
  // 로그인한 사용자 정보를 저장합니다.
  setUser: (user) => write(KEYS.user, user),
  // 저장된 사용자 정보를 지웁니다.
  clearUser: () => localStorage.removeItem(KEYS.user),
  // 저장된 추천 취향을 읽습니다. 없으면 null입니다.
  getPreferences: () => read(KEYS.preferences, null),
  // 추천 취향을 저장합니다.
  setPreferences: (preferences) => write(KEYS.preferences, preferences),
  // 저장한 게임 목록을 읽습니다. 없으면 빈 배열입니다.
  getFavorites: () => read(KEYS.favorites, []),
  // 저장한 게임 목록을 덮어씁니다.
  setFavorites: (favorites) => write(KEYS.favorites, favorites),
};
