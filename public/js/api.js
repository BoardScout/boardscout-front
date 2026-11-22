const DEFAULT_HEADERS = { "Content-Type": "application/json" };
const RECOMMENDATION_PREFIX = "/api/v1/recommendations/";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

// 이름이 일치하는 쿠키 값을 디코딩해 반환합니다. 없으면 null을 반환합니다.
const readCookie = (name) => {
  // 쿠키 값은 URL 인코딩될 수 있으므로 이름이 일치하는 값만 골라 디코딩합니다.
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
};

let csrfRequest = null;

// 쿠키에 CSRF 토큰이 있으면 그대로 쓰고, 없으면 서버에서 발급받아 반환합니다.
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

// 모든 API 호출이 거치는 공통 요청 함수입니다. core 서버의 상태 변경 요청에는 CSRF 헤더를 붙이고, 실패 응답은 ApiError로 던집니다.
export async function request(path, options = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = { ...DEFAULT_HEADERS, ...options.headers };
  // 추천 서버는 CSRF 토큰을 검증하지 않으므로 core 서버(/api/v1/)로 가는 요청에만 붙입니다.
  if (path.startsWith("/api/v1/") && !path.startsWith(RECOMMENDATION_PREFIX) && !SAFE_METHODS.has(method)) {
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
  // 이름으로 보드게임을 검색해 페이지 단위로 가져옵니다.
  searchBoardGames: (query, page = 0, size = 20) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    return request(`/api/v1/board-games?${params}`);
  },
  // 마지막으로 받은 id(cursor) 이후의 게임 목록을 이어서 가져옵니다.
  browseBoardGames: (query = "", cursor = null, size = 24) => {
    const params = new URLSearchParams({ query, size: String(size) });
    if (cursor !== null) params.set("cursor", String(cursor));
    return request(`/api/v1/board-games/cursor?${params}`);
  },
  register: (body) => request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) }),
  // 성공하면 서버가 HttpOnly BGSESSION 쿠키를 내려 줍니다.
  login: (body) => request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/v1/auth/logout", { method: "POST" }),
  me: () => request("/api/v1/users/me"),
  preferences: () => request("/api/v1/users/me/preferences"),
  savePreferences: (body) => request("/api/v1/users/me/preferences", { method: "PUT", body: JSON.stringify(body) }),
  ratings: () => request("/api/v1/users/me/ratings"),
  // 별점 API는 board_games.id가 아니라 데이터셋 ID(datasetItemId)를 씁니다.
  saveRating: (datasetItemId, rating) => request(`/api/v1/users/me/ratings/${datasetItemId}`, {
    method: "PUT",
    body: JSON.stringify({ rating }),
  }),
  removeRating: (datasetItemId) => request(`/api/v1/users/me/ratings/${datasetItemId}`, { method: "DELETE" }),
  // 관심 등록도 별점처럼 데이터셋 ID를 씁니다. 등록(PUT)과 해제(DELETE)는 여러 번 호출해도 결과가 같습니다.
  favorites: () => request("/api/v1/users/me/favorites"),
  addFavorite: (datasetItemId) => request(`/api/v1/users/me/favorites/${datasetItemId}`, { method: "PUT" }),
  removeFavorite: (datasetItemId) => request(`/api/v1/users/me/favorites/${datasetItemId}`, { method: "DELETE" }),
};

// FastAPI 추천 서버입니다. Nginx가 /api/v1/recommendations/ 경로만 이쪽으로 보냅니다.
export const recommendationApi = {
  health: () => request("/api/v1/recommendations/health"),
  // 추천 서버가 인식한 현재 로그인 사용자를 확인합니다.
  me: () => request("/api/v1/recommendations/me"),
  // 응답 항목의 gameId는 데이터셋 ID입니다. 화면에서는 toViewGame()으로 변환해 씁니다.
  games: (body, limit = 12) => request(`/api/v1/recommendations/games?limit=${limit}`, { method: "POST", body: JSON.stringify(body) }),
};
