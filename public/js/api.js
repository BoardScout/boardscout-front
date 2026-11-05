const DEFAULT_HEADERS = { "Content-Type": "application/json" };

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers: { ...DEFAULT_HEADERS, ...options.headers },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = payload?.message || payload?.detail || `요청에 실패했습니다. (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export const coreApi = {
  health: () => request("/api/core/health"),
  register: (body) => request("/api/core/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/core/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/core/auth/logout", { method: "POST" }),
  me: () => request("/api/core/users/me"),
  preferences: () => request("/api/core/users/me/preferences"),
  savePreferences: (body) => request("/api/core/users/me/preferences", { method: "PUT", body: JSON.stringify(body) }),
  favorites: () => request("/api/core/users/me/favorites"),
  addFavorite: (gameId) => request(`/api/core/users/me/favorites/${gameId}`, { method: "POST" }),
  removeFavorite: (gameId) => request(`/api/core/users/me/favorites/${gameId}`, { method: "DELETE" }),
};

export const recommendationApi = {
  health: () => request("/api/recommend/health"),
  me: () => request("/api/recommend/me"),
  games: () => request("/api/recommend/games"),
};
