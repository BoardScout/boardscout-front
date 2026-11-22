import { coreApi } from "../api.js";
import { GAMES, getPlayerLabel, isFavorite, syncFavorites, toggleFavorite } from "../recommendations.js";
import { initChrome, requireLogin, showToast } from "../ui.js";
import { bindStarRatings, loadRatings, starRatingHtml } from "../star-rating.js";
import { displayTitle, toViewGame } from "../game-model.js";
import { escapeHtml, openGameDetail, safeImageUrl } from "../game-detail.js";

initChrome();

const PAGE_SIZE = 24;
const form = document.querySelector("#catalogSearch");
const queryInput = document.querySelector("#catalogQuery");
const grid = document.querySelector("#catalogGrid");
const status = document.querySelector("#catalogStatus");
const loadMore = document.querySelector("#loadMore");
let cursor = null;
let activeQuery = "";
let loading = false;
const savedRatings = await loadRatings();
// 카드의 관심 등록 표시가 서버 기준이 되도록 첫 렌더 전에 목록을 맞춥니다.
await syncFavorites();

// 카드를 그릴 때 게임 정보를 보관했다가 상세 창에서 id로 다시 찾습니다.
const gamesById = new Map();

// 서버·내장 데이터의 테마 코드를 카드 겉에 보여 줄 한글 이름으로 바꿉니다.
const THEME_LABELS = { strategy: "전략", party: "파티", adventure: "모험", mystery: "추리", scifi: "SF", family: "가족", history: "역사", building: "건설" };
const themeTags = (game) => {
  const fromThemes = (game.themes ?? []).map((code) => THEME_LABELS[code]).filter(Boolean);
  const tags = fromThemes.length ? fromThemes : String(game.category ?? "").split(/\s+/).filter(Boolean);
  return tags.slice(0, 2);
};

// 서버가 없을 때 내장 게임 목록에서 커서 이후의 게임을 한 페이지만큼 잘라 반환합니다.
const localPage = (query, after) => {
  const keyword = query.toLocaleLowerCase("ko");
  const matches = GAMES
    .filter((game) => game.id > (after ?? -1))
    .filter((game) => !keyword
      || game.title.toLocaleLowerCase("ko").includes(keyword)
      || game.localizedTitle.toLocaleLowerCase("ko").includes(keyword))
    .sort((left, right) => left.id - right.id);
  const items = matches.slice(0, PAGE_SIZE);
  const hasNext = matches.length > PAGE_SIZE;
  return { items, hasNext, nextCursor: hasNext ? items.at(-1).id : null };
};

// 서버에서 다음 페이지를 가져오고, 실패하면 내장 목록으로 대신합니다.
const fetchPage = async () => {
  try {
    const payload = await coreApi.browseBoardGames(activeQuery, cursor, PAGE_SIZE);
    return payload.result ?? payload;
  } catch {
    return { ...localPage(activeQuery, cursor), offline: true };
  }
};

// 게임 한 건을 카탈로그 카드 HTML 문자열로 만듭니다.
const renderCard = (game) => {
  gamesById.set(Number(game.id), game);
  const name = displayTitle(game);
  const imageUrl = safeImageUrl(game.imageUrl);
  const saved = isFavorite(game);
  const players = Number.isFinite(game.minPlayers) && Number.isFinite(game.maxPlayers)
    ? getPlayerLabel(game)
    : "인원 정보 없음";
  const playTime = game.maxPlayTime ? `${game.maxPlayTime}분` : "시간 정보 없음";
  const facts = [players, playTime].filter(Boolean);
  return `
    <article class="catalog-card" data-game-id="${escapeHtml(game.id)}">
      <div class="catalog-card__cover">
        <div class="catalog-card__image" data-open-detail role="button" tabindex="0" aria-label="${escapeHtml(name)} 상세 보기">
          ${imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} 보드게임 표지" loading="lazy" />`
            : `<span aria-hidden="true">${escapeHtml(name.slice(0, 1))}</span>`}
        </div>
        ${themeTags(game).length ? `<ul class="catalog-card__tags" aria-label="테마">${themeTags(game).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : ""}
        <button class="catalog-save" type="button" data-game-id="${escapeHtml(game.id)}" aria-pressed="${saved}">${saved ? "관심 등록됨" : "관심 등록"}</button>
        <div class="catalog-card__rate">${starRatingHtml(game.id, name, savedRatings.get(game.datasetItemId))}</div>
      </div>
      <h2 data-open-detail role="button" tabindex="0">${escapeHtml(name)}<small>${game.localizedTitle ? escapeHtml(game.title || "") : ""}</small></h2>
      <p class="catalog-card__facts">${facts.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</p>
    </article>`;
};

// 현재 검색어와 커서로 게임 목록을 불러와 그리드에 붙입니다. reset이면 목록을 비우고 처음부터 불러옵니다.
const load = async ({ reset = false } = {}) => {
  if (loading) return;
  loading = true;
  loadMore.disabled = true;
  status.textContent = "불러오는 중…";
  grid.setAttribute("aria-busy", "true");
  if (reset) {
    cursor = null;
    grid.innerHTML = "";
  }

  const page = await fetchPage();
  const items = (page.items ?? []).map(toViewGame);
  grid.insertAdjacentHTML("beforeend", items.map(renderCard).join(""));
  cursor = page.nextCursor ?? null;
  loadMore.hidden = !page.hasNext;
  loadMore.disabled = false;
  grid.removeAttribute("aria-busy");
  const count = grid.querySelectorAll(".catalog-card").length;
  if (!count) {
    status.textContent = "";
    grid.innerHTML = `<div class="empty-state">${activeQuery ? `‘${escapeHtml(activeQuery)}’와 맞는 게임이 없어요.<br />철자를 확인하거나 영문 이름으로 찾아보세요.` : "표시할 게임이 없어요."}${activeQuery ? '<br /><button class="text-link" type="button" data-reset-search>전체 게임 보기</button>' : ""}</div>`;
  } else {
    status.textContent = `${count}개의 게임`;
  }
  loading = false;
};

// 카드의 이미지나 제목을 누르면 상세 창을 엽니다.
grid.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-detail]");
  if (!trigger) return;
  const game = gamesById.get(Number(trigger.closest(".catalog-card").dataset.gameId));
  if (game) openGameDetail(game);
});
// 키보드의 Enter와 Space로도 같은 상세 열기 동작을 쓸 수 있게 합니다.
grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const trigger = event.target.closest("[data-open-detail]");
  if (!trigger) return;
  event.preventDefault();
  trigger.click();
});

// 검색어를 새로 적용해 목록을 처음부터 다시 불러옵니다.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = queryInput.value.trim();
  load({ reset: true });
});

// 검색 결과가 없을 때 나오는 버튼으로 검색어를 지우고 전체 목록으로 돌아갑니다.
grid.addEventListener("click", (event) => {
  if (!event.target.closest("[data-reset-search]")) return;
  queryInput.value = "";
  activeQuery = "";
  load({ reset: true });
});

// 더 보기 버튼을 누르면 다음 페이지를 이어서 불러옵니다.
loadMore.addEventListener("click", () => load());

// 카드의 저장 버튼으로 게임을 저장 목록에 넣거나 뺍니다.
grid.addEventListener("click", async (event) => {
  const button = event.target.closest(".catalog-save");
  if (!button) return;
  if (!(await requireLogin("관심 게임으로 등록하려면 로그인해 주세요."))) return;
  const game = gamesById.get(Number(button.dataset.gameId));
  if (!game) return;
  const title = displayTitle(game);
  try {
    const result = await toggleFavorite(game);
    button.textContent = result.saved ? "관심 등록됨" : "관심 등록";
    button.setAttribute("aria-pressed", String(result.saved));
    showToast(result.saved ? `${title} · 관심 등록했습니다` : `${title} · 관심 등록을 해제했습니다`);
  } catch {
    showToast("관심 등록을 저장하지 못했습니다");
  }
});

// 별 입력은 이벤트 위임으로 처리해, 나중에 붙는 카드도 한 번만 연결합니다.
bindStarRatings(grid, (group) => gamesById.get(Number(group.dataset.uid)), savedRatings);

// 페이지에 들어오면 첫 페이지를 바로 불러옵니다.
load({ reset: true });
