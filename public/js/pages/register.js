import { registerAccount } from "../auth.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#registerForm");
const message = document.querySelector("#formMessage");

// 가입 폼을 제출하면 입력을 검사한 뒤 회원가입을 요청하고, 성공하면 로그인 화면으로 이동합니다.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  // 서버 요청 전에 비밀번호 확인값을 검사해 불필요한 가입 요청을 막습니다.
  if (data.password !== data.passwordConfirm) {
    message.textContent = "비밀번호가 서로 다릅니다.";
    return;
  }
  const submit = form.querySelector("button[type='submit']");
  // 가입 처리 중 버튼을 잠가 같은 계정이 중복 생성되는 것을 방지합니다.
  submit.disabled = true;
  message.textContent = "계정을 만들고 있습니다…";
  try {
    await registerAccount({
      email: data.email,
      nickname: data.nickname,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });
    window.location.href = "/login.html?registered=true";
  } catch (error) {
    const fieldErrors = error.payload?.result;
    message.textContent = fieldErrors && typeof fieldErrors === "object"
      ? Object.values(fieldErrors)[0]
      : error.message;
  } finally {
    submit.disabled = false;
  }
});
