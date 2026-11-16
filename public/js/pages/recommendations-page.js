import { getDifficultyLabel, getPlayerLabel, getPreferences, getRecommendations, toggleFavorite } from "../recommendations.js?v=20261116-2";
import { coreApi } from "../api.js";
import { initChrome, showToast } from "../ui.js";

initChrome();
const list = document.querySelector("#recommendationList");
const preferences = await getPreferences();
const isTaste = preferences?.recommendationMode === "taste";
document.querySelector("#resultKicker").textContent = isTaste ? "내 취향과 가까운 게임" : "당신을 위한 추천";
document.querySelector("#resultTitle").innerHTML = isTaste
  ? "좋아한 게임 다음에는<br /><em>이런 게임.</em>"
  : "오늘의 테이블에 맞는<br /><em>추천 게임.</em>";
document.querySelector("#resultLead").textContent = isTaste
  ? "선택한 게임의 테마, 플레이 방식, 복잡도가 가까운 순서입니다. 이미 고른 게임은 결과에서 제외했습니다."
  : "인원과 시간으로 후보를 좁히고 난이도, 테마, 플레이 방식의 일치도를 종합했습니다.";
document.querySelector("#retryLink").href = isTaste ? "/taste.html" : "/preferences.html";

const games = await getRecommendations();
let savedRatings = new Map();
try {
  const payload = await coreApi.ratings();
  const ratings = payload.result ?? payload;
  savedRatings = new Map(ratings.map((item) => [Number(item.datasetItemId), Number(item.rating)]));
} catch {
  // 로그인하지 않았거나 별점 조회에 실패해도 앞서 받아 둔 추천 목록은 표시한다.
}
list.innerHTML = games.length ? games.map((game, index) => `
  <article class="recommendation-row">
    <div class="recommendation-art" aria-hidden="true"></div>
    <div class="recommendation-copy">
      <p class="page-kicker">${String(index + 1).padStart(2, "0")} · ${game.category}</p>
      <h2>${game.localizedTitle ?? game.title}<small>${game.localizedTitle ? game.title : ""}</small></h2>
      <p>${getPlayerLabel(game)} · 약 ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p>
      <p>${game.reason ?? "당신의 플레이 조건과 잘 맞는 게임입니다."}</p>
      <button class="text-link save-game" type="button" data-index="${index}">저장하기</button>
      <form class="rating-control" data-index="${index}">
        <label for="rating-${index}">내 별점</label>
        <select id="rating-${index}" name="rating" aria-label="${game.localizedTitle ?? game.title} 별점">
          <option value="">1~10점</option>
          ${Array.from({ length: 10 }, (_, offset) => offset + 1).map((rating) => `
            <option value="${rating}" ${savedRatings.get(Number(game.gameId ?? game.id)) === rating ? "selected" : ""}>${rating}점</option>
          `).join("")}
        </select>
        <button class="text-link" type="submit">평가 저장</button>
      </form>
    </div>
    <div class="match-score">${game.score ?? 86}<small>일치도</small></div>
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

list.querySelectorAll(".rating-control").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const game = games[Number(form.dataset.index)];
    // 별점 API는 Spring의 게임 PK 대신 추천 모델이 쓰는 데이터셋 ID를 받는다.
    const datasetItemId = Number(game.gameId ?? game.id);
    const rating = Number(new FormData(form).get("rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      showToast("1점부터 10점 사이에서 별점을 선택해 주세요");
      return;
    }
    try {
      await coreApi.saveRating(datasetItemId, rating);
      savedRatings.set(datasetItemId, rating);
      showToast(`${game.localizedTitle ?? game.title} · ${rating}점을 저장했습니다`);
    } catch (error) {
      showToast(error.status === 401 ? "별점을 저장하려면 로그인해 주세요" : "별점을 저장하지 못했습니다");
    }
  });
});
