import { getRecommendations, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";

initChrome();
const list = document.querySelector("#recommendationList");

const games = await getRecommendations();
list.innerHTML = games.map((game, index) => `
  <article class="recommendation-row">
    <div class="recommendation-art" aria-hidden="true"></div>
    <div class="recommendation-copy">
      <p class="page-kicker">${String(index + 1).padStart(2, "0")} · ${game.category}</p>
      <h2>${game.title}</h2>
      <p>${game.players} · 약 ${game.minutes}분 · 난이도 ${game.difficulty}/3</p>
      <p>${game.reason ?? "당신의 플레이 조건과 잘 맞는 게임입니다."}</p>
      <button class="text-link save-game" type="button" data-index="${index}">저장하기</button>
    </div>
    <div class="match-score">${game.score ?? 86}<small>MATCH</small></div>
  </article>
`).join("");

list.querySelectorAll(".save-game").forEach((button) => {
  button.addEventListener("click", async () => {
    const game = games[Number(button.dataset.index)];
    const result = await toggleFavorite(game);
    button.textContent = result.saved ? "저장됨" : "저장하기";
    showToast(result.saved ? `${game.title} · 내 게임에 저장했습니다` : `${game.title} · 저장을 해제했습니다`);
  });
});
