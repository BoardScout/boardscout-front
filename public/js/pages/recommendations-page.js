import { getDifficultyLabel, getPlayerLabel, getPreferences, getRecommendations, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";

initChrome();
const list = document.querySelector("#recommendationList");
const preferences = await getPreferences();
const isTaste = preferences?.recommendationMode === "taste";
document.querySelector("#resultKicker").textContent = isTaste ? "YOUR TASTE, MATCHED" : "YOUR NIGHT, CURATED";
document.querySelector("#resultTitle").innerHTML = isTaste
  ? "좋아한 게임 다음에는<br /><em>이런 게임.</em>"
  : "오늘의 테이블에 맞는<br /><em>추천 게임.</em>";
document.querySelector("#resultLead").textContent = isTaste
  ? "선택한 게임의 테마, 플레이 방식, 복잡도가 가까운 순서입니다. 이미 고른 게임은 결과에서 제외했습니다."
  : "인원과 시간으로 후보를 좁히고 난이도, 테마, 플레이 방식의 일치도를 종합했습니다.";
document.querySelector("#retryLink").href = isTaste ? "/taste.html" : "/preferences.html";

const games = await getRecommendations();
list.innerHTML = games.length ? games.map((game, index) => `
  <article class="recommendation-row">
    <div class="recommendation-art" aria-hidden="true"></div>
    <div class="recommendation-copy">
      <p class="page-kicker">${String(index + 1).padStart(2, "0")} · ${game.category}</p>
      <h2>${game.localizedTitle ?? game.title}<small>${game.localizedTitle ? game.title : ""}</small></h2>
      <p>${getPlayerLabel(game)} · 약 ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p>
      <p>${game.reason ?? "당신의 플레이 조건과 잘 맞는 게임입니다."}</p>
      <button class="text-link save-game" type="button" data-index="${index}">저장하기</button>
    </div>
    <div class="match-score">${game.score ?? 86}<small>MATCH</small></div>
  </article>
`).join("") : `<div class="empty-state">지금 조건에 맞는 게임이 없습니다.<br /><a class="text-link" href="/preferences.html">조건을 다시 고르기</a></div>`;

list.querySelectorAll(".save-game").forEach((button) => {
  button.addEventListener("click", async () => {
    const game = games[Number(button.dataset.index)];
    const result = await toggleFavorite(game);
    button.textContent = result.saved ? "저장됨" : "저장하기";
    showToast(result.saved ? `${game.title} · 내 게임에 저장했습니다` : `${game.title} · 저장을 해제했습니다`);
  });
});
