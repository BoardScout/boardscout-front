import { getCurrentUser } from "../auth.js";
import { getDifficultyLabel, getLocalFavorites, getPlayerLabel, getPreferences, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";
import { coreApi } from "../api.js";
import { GAMES } from "../recommendations.js";
import { loadRatings, readRatedGameCache } from "../star-rating.js";

initChrome();
const user = await getCurrentUser();
const preferences = await getPreferences();
// 로그인 여부와 관계없이 확인 가능한 정보로 계정 요약을 구성합니다.
document.querySelector("#accountName").textContent = user?.nickname || user?.name || "게스트 플레이어";
document.querySelector("#accountId").textContent = user?.email || "로그인 전";
document.querySelector("#preferenceSummary").textContent = preferences
  ? preferences.recommendationMode === "taste"
    ? "내 별점 기반 추천"
    : `${preferences.playerCount ?? "-"}인 · ${preferences.maxPlayTime ?? "-"}분 · 난이도 ${preferences.difficulty ?? "-"}`
  : "아직 저장된 취향이 없습니다.";

// 접힌 상태에서 보여 줄 한 줄 요약입니다. 이름 두 개와 나머지 개수를 알려 줍니다.
const summarize = (names, empty) => !names.length ? empty : names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} 외 ${names.length - 2}개`;

// 제목 줄을 눌러 목록을 펼치고 접습니다. 처음에는 요약만 보입니다.
document.querySelectorAll(".shelf__toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    document.getElementById(toggle.getAttribute("aria-controls")).hidden = !open;
  });
});

const savedList = document.querySelector("#savedList");
// 저장 목록 변경 후 같은 렌더 함수를 호출해 빈 상태와 목록 상태를 일관되게 유지합니다.
const renderSaved = () => {
  const favorites = getLocalFavorites();
  savedList.innerHTML = favorites.length ? favorites.map((game) => `
    <article class="saved-item">
      <div><h3>${game.localizedTitle ?? game.nameKo ?? game.title ?? game.nameEn}${game.localizedTitle || game.nameKo ? `<small>${game.title ?? game.nameEn}</small>` : ""}</h3><p>${game.category} · ${getPlayerLabel(game)} · ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p></div>
      <button class="text-link remove-favorite" type="button" data-id="${game.id}">삭제</button>
    </article>
  `).join("") : '<div class="empty-state">관심 등록한 게임이 없습니다.<br><a class="text-link" href="/recommendations.html">추천 게임 보러가기</a></div>';
  document.querySelector("#favoriteSummary").textContent = summarize(favorites.map((game) => game.localizedTitle ?? game.nameKo ?? game.title ?? game.nameEn), "아직 없어요");
};
renderSaved();

savedList.addEventListener("click", async (event) => {
  // 목록 전체에 이벤트를 위임해 다시 렌더링된 삭제 버튼도 계속 동작하게 합니다.
  const button = event.target.closest(".remove-favorite");
  if (!button) return;
  const game = getLocalFavorites().find((item) => item.id === Number(button.dataset.id));
  if (game) await toggleFavorite(game);
  renderSaved();
  showToast("관심 게임에서 뺐습니다");
});

// 별점 준 게임: 서버의 별점 목록에 브라우저가 기억한 이름과 내장 게임 이름을 붙여 보여 줍니다.
const ratedList = document.querySelector("#ratedList");
const ratings = await loadRatings();
const nameCache = readRatedGameCache();
const describe = (id) => {
  const local = GAMES.find((game) => game.id === id);
  const cached = nameCache[id];
  return {
    title: cached?.title ?? local?.localizedTitle ?? local?.title ?? `게임 #${id}`,
    subtitle: cached?.subtitle ?? (local?.localizedTitle ? local.title : ""),
    category: cached?.category ?? local?.category ?? "",
  };
};
const renderRated = () => {
  const entries = [...ratings].sort((a, b) => b[1] - a[1]);
  ratedList.innerHTML = entries.length ? entries.map(([id, rating]) => {
    const info = describe(id);
    return `<article class="saved-item">
      <div><h3>${info.title}${info.subtitle ? `<small>${info.subtitle}</small>` : ""}</h3><p>${info.category}</p></div>
      <div class="saved-item__side"><b class="saved-item__score">${rating}점</b><button class="text-link remove-rating" type="button" data-id="${id}">삭제</button></div>
    </article>`;
  }).join("") : '<div class="empty-state">별점을 준 게임이 없습니다.<br><a class="text-link" href="/games.html">전체 게임에서 별점 남기기</a></div>';
  document.querySelector("#ratingSummary").textContent = summarize(entries.map(([id, rating]) => `${describe(id).title} ${rating}점`), "아직 없어요");
};
renderRated();
ratedList.addEventListener("click", async (event) => {
  const button = event.target.closest(".remove-rating");
  if (!button) return;
  const id = Number(button.dataset.id);
  try {
    await coreApi.removeRating(id);
    ratings.delete(id);
    renderRated();
    showToast("별점을 삭제했습니다");
  } catch {
    showToast("별점을 삭제하지 못했습니다");
  }
});
