import { coreApi } from "./api.js";
import { localSession } from "./storage.js";

export async function registerAccount(payload) {
  const response = await coreApi.register(payload);
  return response.result ?? response;
}

export async function loginAccount(payload) {
  const response = await coreApi.login(payload);
  const user = response.result ?? response;
  localSession.setUser(user);
  return user;
}

export async function getCurrentUser() {
  try {
    const user = await coreApi.me();
    localSession.setUser(user);
    return user;
  } catch {
    // 서버 조회 실패 시 마지막으로 확인한 사용자를 사용해 화면 상태를 유지합니다.
    return localSession.getUser();
  }
}

export async function logoutAccount() {
  try { await coreApi.logout(); } catch { /* 로컬 데모 세션도 동일하게 종료합니다. */ }
  localSession.clearUser();
}
