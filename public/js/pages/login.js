import { loginAccount } from "../auth.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#loginForm");
const message = document.querySelector("#formMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
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
