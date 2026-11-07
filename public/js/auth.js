import { ApiError, coreApi } from "./api.js";
import { localSession } from "./storage.js";

const demoUser = (username, name = "보드게임 플레이어") => ({ id: "demo", username, name, demo: true });
const canUseDemoFallback = (error) => error instanceof TypeError || [404, 502, 503].includes(error.status);

export async function registerAccount(payload) {
  try {
    const user = await coreApi.register(payload);
    localSession.setUser(user);
    return user;
  } catch (error) {
    if (!canUseDemoFallback(error)) throw error;
    const user = demoUser(payload.username, payload.name);
    localSession.setUser(user);
    return user;
  }
}

export async function loginAccount(payload) {
  try {
    const user = await coreApi.login(payload);
    localSession.setUser(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && [400, 401, 403].includes(error.status)) throw error;
    if (!canUseDemoFallback(error)) throw error;
    const user = demoUser(payload.username);
    localSession.setUser(user);
    return user;
  }
}

export async function getCurrentUser() {
  try {
    const user = await coreApi.me();
    localSession.setUser(user);
    return user;
  } catch {
    return localSession.getUser();
  }
}

export async function logoutAccount() {
  try { await coreApi.logout(); } catch { /* 로컬 데모 세션도 동일하게 종료합니다. */ }
  localSession.clearUser();
}
