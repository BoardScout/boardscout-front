import { getPreferences, savePreferences } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#preferenceForm");
const message = document.querySelector("#formMessage");

const current = await getPreferences();
if (current?.recommendationMode === "context") {
  for (const [key, value] of Object.entries(current)) {
    const values = Array.isArray(value) ? value : [String(value)];
    values.forEach((item) => {
      const control = form.querySelector(`[name="${key}"][value="${item}"]`);
      if (control) control.checked = true;
    });
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    recommendationMode: "context",
    playerCount: Number(data.get("playerCount")),
    maxPlayTime: Number(data.get("maxPlayTime")),
    difficulty: Number(data.get("difficulty")),
    themes: data.getAll("themes"),
    playStyles: data.getAll("playStyles"),
  };
  message.textContent = "지금 플레이할 수 있는 게임을 고르고 있습니다…";
  await savePreferences(payload);
  window.location.href = "/recommendations.html";
});
