import { getCurrentUser, logoutAccount } from "../auth.js";
import { getDifficultyLabel, getLocalFavorites, getPlayerLabel, getPreferences, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";

initChrome();
const user = await getCurrentUser();
const preferences = await getPreferences();
// 로그인 여부와 관계없이 확인 가능한 정보로 계정 요약을 구성합니다.
document.querySelector("#accountName").textContent = user?.name || user?.username || "게스트 플레이어";
document.querySelector("#accountId").textContent = user?.username || "로그인 전";
document.querySelector("#preferenceSummary").textContent = preferences
  ? preferences.recommendationMode === "taste"
    ? "내 별점 기반 추천"
    : `${preferences.playerCount ?? "-"}인 · ${preferences.maxPlayTime ?? "-"}분 · 난이도 ${preferences.difficulty ?? "-"}`
  : "아직 저장된 취향이 없습니다.";

const savedList = document.querySelector("#savedList");
// 저장 목록 변경 후 같은 렌더 함수를 호출해 빈 상태와 목록 상태를 일관되게 유지합니다.
const renderSaved = () => {
  const favorites = getLocalFavorites();
  savedList.innerHTML = favorites.length ? favorites.map((game) => `
    <article class="saved-item">
      <div><h3>${game.localizedTitle ?? game.nameKo ?? game.title ?? game.nameEn}${game.localizedTitle || game.nameKo ? `<small>${game.title ?? game.nameEn}</small>` : ""}</h3><p>${game.category} · ${getPlayerLabel(game)} · ${game.maxPlayTime}분 · ${getDifficultyLabel(game.complexity ?? 2.3)}</p></div>
      <button class="text-link remove-favorite" type="button" data-id="${game.id}">삭제</button>
    </article>
  `).join("") : '<div class="empty-state">저장한 게임이 없습니다.<br><a class="text-link" href="/recommendations.html">추천 게임 보러가기</a></div>';
};
renderSaved();

savedList.addEventListener("click", async (event) => {
  // 목록 전체에 이벤트를 위임해 다시 렌더링된 삭제 버튼도 계속 동작하게 합니다.
  const button = event.target.closest(".remove-favorite");
  if (!button) return;
  const game = getLocalFavorites().find((item) => item.id === Number(button.dataset.id));
  if (game) await toggleFavorite(game);
  renderSaved();
  showToast("저장 목록에서 삭제했습니다");
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await logoutAccount();
  window.location.href = "/";
});
