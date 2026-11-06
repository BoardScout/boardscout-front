import { GAMES, getDifficultyLabel, getPreferences, savePreferences } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();
const form = document.querySelector("#tasteForm");
const picker = document.querySelector("#gamePicker");
const search = document.querySelector("#gameSearch");
const count = document.querySelector("#selectedCount");
const submit = document.querySelector("#tasteSubmit");
const message = document.querySelector("#formMessage");
const current = await getPreferences();
const selected = new Set(current?.recommendationMode === "taste" ? current.likedGameIds : []);

const render = (query = "") => {
  const keyword = query.trim().toLocaleLowerCase("ko");
  const visible = GAMES.filter((game) => !keyword
    || game.title.toLowerCase().includes(keyword)
    || game.localizedTitle.includes(keyword));
  picker.innerHTML = visible.map((game) => `
    <label class="game-choice">
      <input type="checkbox" value="${game.id}" ${selected.has(game.id) ? "checked" : ""} />
      <span><b>${game.localizedTitle}</b><small>${game.title}</small><em>${game.category} · ${getDifficultyLabel(game.complexity)} · ${game.maxPlayTime}분</em></span>
    </label>
  `).join("");
};

const updateState = () => {
  count.textContent = String(selected.size);
  submit.disabled = selected.size < 3;
};

picker.addEventListener("change", (event) => {
  const gameId = Number(event.target.value);
  if (event.target.checked) selected.add(gameId);
  else selected.delete(gameId);
  updateState();
});
search.addEventListener("input", () => render(search.value));
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (selected.size < 3) {
    message.textContent = "좋아했던 게임을 3개 이상 골라주세요.";
    return;
  }
  message.textContent = "선택한 게임에서 취향의 공통점을 찾고 있습니다…";
  await savePreferences({ recommendationMode: "taste", likedGameIds: [...selected] });
  window.location.href = "/recommendations.html";
});

render();
updateState();
