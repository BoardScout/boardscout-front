import { getSessionUser, loginAccount } from "../auth.js";
import { initChrome } from "../ui.js";

initChrome();
// 이미 로그인한 세션이 있으면 로그인 화면을 건너뜁니다.
if (await getSessionUser()) window.location.replace("/preferences.html");
const form = document.querySelector("#loginForm");
const message = document.querySelector("#formMessage");

// 회원가입 직후 넘어온 경우 가입 완료 안내를 먼저 보여줍니다.
if (new URLSearchParams(window.location.search).get("registered") === "true") {
  message.textContent = "회원가입이 완료되었습니다. 새 계정으로 로그인해 주세요.";
}

// 로그인 폼을 제출하면 로그인하고 취향 입력 화면으로 이동합니다. 실패하면 오류 메시지를 보여줍니다.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
  // 요청 중 중복 제출을 막고 현재 진행 상태를 사용자에게 알립니다.
  submit.disabled = true;
  message.textContent = "로그인 정보를 확인하고 있습니다…";
  try {
    const data = Object.fromEntries(new FormData(form));
    await loginAccount(data);
    window.location.href = "/preferences.html";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
