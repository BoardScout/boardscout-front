const DEFAULT_HEADERS = { "Content-Type": "application/json" };
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

const readCookie = (name) => {
  // 쿠키 값은 URL 인코딩될 수 있으므로 이름이 일치하는 값만 골라 디코딩합니다.
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
};

let csrfRequest = null;

async function getCsrfToken() {
  const current = readCookie("XSRF-TOKEN");
  if (current) return current;

  // 동시에 여러 요청이 시작돼도 토큰 발급 API는 한 번만 호출합니다.
  csrfRequest ??= fetch("/api/v1/auth/csrf", { credentials: "include" })
    .then((response) => {
      if (!response.ok) throw new ApiError("CSRF 토큰을 발급받지 못했습니다.", response.status);
      const token = readCookie("XSRF-TOKEN");
      if (!token) throw new ApiError("CSRF 토큰 쿠키가 없습니다.");
      return token;
    })
    .finally(() => { csrfRequest = null; });

  return csrfRequest;
}

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
  const method = (options.method ?? "GET").toUpperCase();
  const headers = { ...DEFAULT_HEADERS, ...options.headers };
  if (path.startsWith("/api/v1/") && !SAFE_METHODS.has(method)) {
    // 쿠키는 브라우저가 자동 전송하지만 이 헤더는 현재 페이지의 JavaScript만 추가할 수 있습니다.
    headers["X-XSRF-TOKEN"] = await getCsrfToken();
  }

  // 인증 쿠키는 Spring과 FastAPI 프록시 요청에 모두 전달합니다.
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers,
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
  ratings: () => request("/api/v1/users/me/ratings"),
  saveRating: (datasetItemId, rating) => request(`/api/v1/users/me/ratings/${datasetItemId}`, {
    method: "PUT",
    body: JSON.stringify({ rating }),
  }),
  removeRating: (datasetItemId) => request(`/api/v1/users/me/ratings/${datasetItemId}`, { method: "DELETE" }),
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
