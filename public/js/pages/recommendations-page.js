import { getDifficultyLabel, getPlayerLabel, getRecommendations, getTasteRecommendations, toggleFavorite } from "../recommendations.js?v=20261119-1";
import { bindStarRatings, loadRatings, starRatingHtml } from "../star-rating.js";
import { displayTitle, toViewGame } from "../game-model.js";
import { initChrome, requireLogin, showToast } from "../ui.js";
import { openGameDetail } from "../game-detail.js";

initChrome();
const list = document.querySelector("#recommendationList");
const isTaste = document.body.dataset.mode === "taste";
const PAGE_SIZE = 10;
let games;
let tasteInfo = null;
if (isTaste) {
  tasteInfo = await getTasteRecommendations();
  games = tasteInfo.items.map(toViewGame);
  const lead = document.querySelector("#resultLead");
  lead.innerHTML = tasteInfo.personalized
    ? `별점 ${tasteInfo.ratingCount}개를 반영했어요. 이미 평가한 게임은 빼고, 취향이 가까운 순서로 보여 드려요.`
    : `별점을 ${tasteInfo.minRatingsRequired}개 이상 남기면 내 취향 추천이 시작돼요(현재 ${tasteInfo.ratingCount}개). 그때까지 평점 높은 인기 게임을 보여 드려요. <a class="text-link" href="/games.html">별점 남기러 가기</a>`;
} else {
  games = (await getRecommendations()).map(toViewGame);
}

const savedRatings = await loadRatings();
// 취향 추천은 10개씩 보여주고 버튼으로 다음 10개를 엽니다.
let visible = isTaste ? PAGE_SIZE : games.length;
const showMore = document.querySelector("#showMore");

// 추천 목록을 화면에 그립니다. 취향 추천은 visible 개수만큼만 보여줍니다.
function render() {
list.innerHTML = games.length ? games.slice(0, visible).map((game, index) => `
  <article class="recommendation-row">
    <div class="recommendation-art" aria-hidden="true"></div>
    <div class="recommendation-copy">
      <p class="page-kicker">${index + 1}위 · ${game.category}</p>
      <h2>${displayTitle(game)}<small>${game.localizedTitle ? game.title : ""}</small></h2>
      <p>${getPlayerLabel(game)} · 약 ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p>
      <p>${game.reason ?? "당신의 플레이 조건과 잘 맞는 게임입니다."}</p>
      ${isTaste ? "" : starRatingHtml(index, displayTitle(game), savedRatings.get(game.datasetItemId))}
    </div>
    <div class="recommendation-side">
      <div class="match-score">${game.score ?? 86}<small>일치도</small></div>
      <button class="secondary-button detail-open" type="button" data-index="${index}" aria-label="${displayTitle(game)} 상세 보기">상세 보기</button>
      <button class="save-game" type="button" data-index="${index}" aria-pressed="false">관심 등록</button>
    </div>
  </article>
`).join("") : `<div class="empty-state">지금 조건에 맞는 게임이 없습니다.<br /><a class="text-link" href="/preferences.html">조건을 다시 고르기</a></div>`;
if (showMore) showMore.hidden = visible >= games.length;
bindRows();
}

// 새로 그린 목록의 저장 버튼과 별점 폼에 이벤트를 연결합니다.
function bindRows() {

list.querySelectorAll(".detail-open").forEach((button) => {
  button.addEventListener("click", () => openGameDetail(games[Number(button.dataset.index)]));
});

list.querySelectorAll(".save-game").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!(await requireLogin("관심 게임으로 등록하려면 로그인해 주세요."))) return;
    const game = games[Number(button.dataset.index)];
    const result = await toggleFavorite(game);
    button.textContent = result.saved ? "관심 등록됨" : "관심 등록";
    button.setAttribute("aria-pressed", String(result.saved));
    showToast(result.saved ? `${game.title} · 관심 게임에 등록했습니다` : `${game.title} · 관심 등록을 해제했습니다`);
  });
});

}

bindStarRatings(list, (group) => games[Number(group.dataset.uid)], savedRatings);

// 더 보기 버튼을 누를 때마다 10개씩 더 보여줍니다.
showMore?.addEventListener("click", () => {
  visible += PAGE_SIZE;
  render();
});
render();
