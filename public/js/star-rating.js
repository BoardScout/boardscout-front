import { coreApi } from "./api.js";
import { requireLogin, showLoginPrompt, showToast } from "./ui.js";
import { getDatasetItemId } from "./game-model.js";

const CACHE_KEY = "boardscout.ratedGames";

// 서버가 별점 목록에 게임 이름을 주지 않으므로, 별점을 줄 때 이름을 브라우저에 기억해 마이페이지에서 씁니다.
export const readRatedGameCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {}; } catch { return {}; }
};
const rememberRatedGame = (game, rating) => {
  try {
    const cache = readRatedGameCache();
    cache[getDatasetItemId(game)] = {
      title: game.localizedTitle ?? game.title,
      subtitle: game.localizedTitle ? game.title : "",
      category: game.category ?? "",
      rating,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* 저장소를 못 쓰면 이름만 기억하지 못합니다. */ }
};

// 내가 남긴 별점을 {데이터셋 ID → 점수} 형태로 불러옵니다. 로그인 전이면 빈 Map입니다.
export async function loadRatings() {
  try {
    const payload = await coreApi.ratings();
    const ratings = payload.result ?? payload;
    return new Map(ratings.map((item) => [Number(item.datasetItemId), Number(item.rating)]));
  } catch {
    return new Map();
  }
}

// 별 5개(반 개 단위, 1~10점) 입력 한 묶음의 HTML입니다. uid는 페이지 안에서 겹치지 않는 값이어야 합니다.
export const starRatingHtml = (uid, name, value) => `
  <fieldset class="star-rating" data-uid="${uid}">
    <legend>내 별점</legend>
    <div class="star-rating__stars">
      ${Array.from({ length: 10 }, (_, i) => i + 1).map((v) => `
        <input type="radio" id="rating-${uid}-${v}" name="rating-${uid}" value="${v}" ${value === v ? "checked" : ""} />
        <label for="rating-${uid}-${v}" class="${v % 2 ? "is-left" : "is-right"}" title="${v}점"><span class="sr-only">${name} ${v}점</span></label>
      `).join("")}
    </div>
    <output class="star-rating__value" aria-live="polite">${value ?? ""}</output>
  </fieldset>`;

// container에 이벤트 위임으로 미리보기와 자동 저장을 연결합니다. 나중에 그려지는 별점 묶음도 동작하며, 한 번만 호출하면 됩니다.
// getGame(group)은 그 묶음의 게임을 돌려줍니다.
export function bindStarRatings(container, getGame, savedRatings) {
  const showChecked = (group) => { group.querySelector("output").textContent = group.querySelector("input:checked")?.value ?? ""; };
  container.addEventListener("pointerover", (event) => {
    const label = event.target.closest(".star-rating label");
    if (label) label.closest(".star-rating").querySelector("output").textContent = label.getAttribute("for").split("-").pop();
  });
  container.addEventListener("pointerout", (event) => {
    const group = event.target.closest(".star-rating");
    if (group && !group.contains(event.relatedTarget)) showChecked(group);
  });
  container.addEventListener("change", async (event) => {
    const group = event.target.closest(".star-rating");
    if (!group) return;
    // 비로그인이면 선택한 별을 되돌리고 로그인 안내 팝업을 띄웁니다.
    if (!(await requireLogin("별점을 남기려면 로그인해 주세요."))) {
      event.target.checked = false;
      showChecked(group);
      return;
    }
    const game = getGame(group);
    const id = getDatasetItemId(game);
    const rating = Number(event.target.value);
    const name = game.localizedTitle ?? game.title;
    group.disabled = true;
    try {
      await coreApi.saveRating(id, rating);
      savedRatings.set(id, rating);
      rememberRatedGame(game, rating);
      showToast(`${name} · ${rating}점 저장됨`);
    } catch (error) {
      // 세션이 만료돼 서버가 401을 돌려준 경우에도 같은 로그인 안내를 보여줍니다.
      if (error.status === 401) showLoginPrompt("별점을 남기려면 로그인해 주세요.");
      else showToast("별점을 저장하지 못했습니다");
    } finally {
      group.disabled = false;
    }
  });
}
