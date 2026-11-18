import { coreApi } from "./api.js";
import { localSession } from "./storage.js";

// 회원가입을 요청하고 가입한 사용자 정보를 반환합니다.
export async function registerAccount(payload) {
  // 회원가입은 계정만 생성하며 로그인 세션은 별도의 로그인 요청에서 발급받습니다.
  const response = await coreApi.register(payload);
  return response.result ?? response;
}

// 로그인하고 받은 사용자 정보를 브라우저에도 저장해 반환합니다.
export async function loginAccount(payload) {
  // 응답의 BGSESSION 쿠키는 HttpOnly이므로 fetch가 브라우저 쿠키 저장소에 자동 반영합니다.
  const response = await coreApi.login(payload);
  const user = response.result ?? response;
  localSession.setUser(user);
  return user;
}

// 서버에서 현재 로그인한 사용자를 조회합니다. 실패하면 마지막으로 저장한 사용자를 대신 반환합니다.
export async function getCurrentUser() {
  try {
    // 브라우저가 BGSESSION 쿠키를 함께 보내면 서버가 Redis 세션으로 현재 사용자를 복원합니다.
    const user = await coreApi.me();
    localSession.setUser(user);
    return user;
  } catch {
    // 서버 조회 실패 시 마지막으로 확인한 사용자를 사용해 화면 상태를 유지합니다.
    return localSession.getUser();
  }
}

// 서버 세션을 종료하고 브라우저에 저장된 사용자 정보도 지웁니다.
export async function logoutAccount() {
  // 서버 세션 삭제 요청 뒤 화면에 남은 사용자 캐시도 함께 비웁니다.
  try { await coreApi.logout(); } catch { /* 서버가 응답하지 않아도 로컬 사용자 표시는 제거합니다. */ }
  localSession.clearUser();
}
