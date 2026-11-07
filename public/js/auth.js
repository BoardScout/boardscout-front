import { ApiError, coreApi } from "./api.js";
import { localSession } from "./storage.js";

const demoUser = (username, name = "보드게임 플레이어") => ({ id: "demo", username, name, demo: true });
// 네트워크 또는 게이트웨이 장애일 때만 데모 모드로 전환하며, 사용자 입력 오류는 그대로 전달합니다.
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
    // 잘못된 계정 정보는 데모 로그인으로 우회하지 않고 폼에 오류를 표시합니다.
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
    // 서버 조회 실패 시 마지막으로 확인한 사용자를 사용해 화면 상태를 유지합니다.
    return localSession.getUser();
  }
}

export async function logoutAccount() {
  try { await coreApi.logout(); } catch { /* 로컬 데모 세션도 동일하게 종료합니다. */ }
  localSession.clearUser();
}
