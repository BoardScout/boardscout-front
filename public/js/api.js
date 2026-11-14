const DEFAULT_HEADERS = { "Content-Type": "application/json" };

// 화면에서 상태 코드와 서버 응답을 함께 처리할 수 있도록 fetch 오류를 표준화합니다.
export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  // 인증 쿠키는 Spring과 FastAPI 프록시 요청에 모두 전달합니다.
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers: { ...DEFAULT_HEADERS, ...options.headers },
  });
  // 오류 응답도 JSON 또는 텍스트 형태를 보존해 각 폼에서 구체적인 메시지를 표시합니다.
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = payload?.message || payload?.detail || `요청에 실패했습니다. (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

// 페이지 코드가 엔드포인트 문자열을 직접 조합하지 않도록 API 경계를 한곳에 모읍니다.
export const coreApi = {
  health: () => request("/api/v1/health"),
  searchBoardGames: (query, page = 0, size = 20) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    return request(`/api/v1/board-games?${params}`);
  },
  browseBoardGames: (query = "", cursor = null, size = 24) => {
    const params = new URLSearchParams({ query, size: String(size) });
    if (cursor !== null) params.set("cursor", String(cursor));
    return request(`/api/v1/board-games/cursor?${params}`);
  },
  register: (body) => request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/v1/auth/logout", { method: "POST" }),
  me: () => request("/api/v1/users/me"),
  preferences: () => request("/api/v1/users/me/preferences"),
  savePreferences: (body) => request("/api/v1/users/me/preferences", { method: "PUT", body: JSON.stringify(body) }),
  favorites: () => request("/api/v1/users/me/favorites"),
  addFavorite: (gameId) => request(`/api/v1/users/me/favorites/${gameId}`, { method: "POST" }),
  removeFavorite: (gameId) => request(`/api/v1/users/me/favorites/${gameId}`, { method: "DELETE" }),
};

// 추천 서버는 게임 목록과 추천 결과 조회만 담당합니다.
export const recommendationApi = {
  health: () => request("/api/recommend/health"),
  me: () => request("/api/recommend/me"),
  games: (body) => request("/api/recommend/games", { method: "POST", body: JSON.stringify(body) }),
};
