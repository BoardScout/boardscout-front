import { getCurrentUser, logoutAccount } from "../auth.js";
import { recommendationApi } from "../api.js";
import { getDifficultyLabel, getLocalFavorites, getPlayerLabel, getPreferences, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";

initChrome();
const user = await getCurrentUser();
const preferences = await getPreferences();
document.querySelector("#accountName").textContent = user?.name || user?.username || "게스트 플레이어";
document.querySelector("#accountId").textContent = user?.username || "로그인 전";
document.querySelector("#preferenceSummary").textContent = preferences
  ? preferences.recommendationMode === "taste"
    ? `좋아한 게임 ${preferences.likedGameIds.length}개 기반`
    : `${preferences.playerCount ?? "-"}인 · ${preferences.maxPlayTime ?? "-"}분 · 난이도 ${preferences.difficulty ?? "-"}`
  : "아직 저장된 취향이 없습니다.";

const savedList = document.querySelector("#savedList");
const renderSaved = () => {
  const favorites = getLocalFavorites();
  savedList.innerHTML = favorites.length ? favorites.map((game) => `
    <article class="saved-item">
      <div><h3>${game.localizedTitle ?? game.title}</h3><p>${game.category} · ${getPlayerLabel(game)} · ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p></div>
      <button class="text-link remove-favorite" type="button" data-id="${game.id}">삭제</button>
    </article>
  `).join("") : '<div class="empty-state">저장한 게임이 없습니다.<br><a class="text-link" href="/recommendations.html">추천 게임 보러가기</a></div>';
};
renderSaved();

savedList.addEventListener("click", async (event) => {
  const button = event.target.closest(".remove-favorite");
  if (!button) return;
  const game = getLocalFavorites().find((item) => item.id === Number(button.dataset.id));
  if (game) await toggleFavorite(game);
  renderSaved();
  showToast("저장 목록에서 삭제했습니다");
});

try {
  const remote = await recommendationApi.me();
  document.querySelector("#fastapiSession").textContent = remote.username || "연결됨";
} catch {
  document.querySelector("#fastapiSession").textContent = user ? "데모 세션" : "미연결";
}
document.querySelector("#springSession").textContent = user ? "인식됨" : "미연결";

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await logoutAccount();
  window.location.href = "/";
});
