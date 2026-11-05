import { getPreferences, savePreferences } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#preferenceForm");
const message = document.querySelector("#formMessage");

const current = await getPreferences();
if (current) {
  for (const [key, value] of Object.entries(current)) {
    const values = Array.isArray(value) ? value : [String(value)];
    values.forEach((item) => {
      const control = form.querySelector(`[name="${key}"][value="${item}"]`) ?? form.querySelector(`[name="${key}"]`);
      if (!control) return;
      if (["checkbox", "radio"].includes(control.type)) control.checked = true;
      else control.value = item;
    });
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    players: data.get("players"),
    minutes: data.get("minutes"),
    difficulty: data.get("difficulty"),
    mood: data.get("mood"),
    genres: data.getAll("genres"),
  };
  message.textContent = "취향을 저장하고 추천을 계산하고 있습니다…";
  await savePreferences(payload);
  window.location.href = "/recommendations.html";
});
