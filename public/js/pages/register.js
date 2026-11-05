import { registerAccount } from "../auth.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#registerForm");
const message = document.querySelector("#formMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.passwordConfirm) {
    message.textContent = "비밀번호가 서로 다릅니다.";
    return;
  }
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  message.textContent = "계정을 만들고 있습니다…";
  try {
    await registerAccount({ name: data.name, username: data.username, password: data.password });
    window.location.href = "/preferences.html";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
