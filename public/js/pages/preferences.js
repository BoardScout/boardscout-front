import { getPreferences, savePreferences } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#preferenceForm");
const message = document.querySelector("#formMessage");

const current = await getPreferences();
// 이전에 저장한 상황 추천 조건이 있으면 폼을 복원해 다시 선택하는 수고를 줄입니다.
if (current?.recommendationMode === "context") {
  for (const [key, value] of Object.entries(current)) {
    const values = Array.isArray(value) ? value : [String(value)];
    values.forEach((item) => {
      const control = form.querySelector(`[name="${key}"][value="${item}"]`);
      if (control) control.checked = true;
    });
  }
}

// 선택한 조건을 저장하고 추천 결과 화면으로 이동합니다.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  // FormData의 문자열 값을 추천 계약에 맞는 숫자와 배열로 변환합니다.
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
