import { coreApi } from "../api.js";
import { GAMES, getDifficultyLabel, getLocalFavorites, getPlayerLabel, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";

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

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const safeImageUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const normalizeGame = (game) => ({
  ...game,
  title: game.nameEn ?? game.title,
  localizedTitle: game.nameKo || game.localizedTitle || game.nameEn || game.title,
  maxPlayTime: game.maxPlayTimeMinutes ?? game.maxPlayTime,
  complexity: Number(game.difficulty ?? game.complexity ?? 0),
  imageUrl: game.thumbnailUrl ?? game.imageUrl,
  reason: game.descriptionKo ?? game.reason,
});

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

const fetchPage = async () => {
  try {
    const payload = await coreApi.browseBoardGames(activeQuery, cursor, PAGE_SIZE);
    return payload.result ?? payload;
  } catch {
    return localPage(activeQuery, cursor);
  }
};

const renderCard = (rawGame) => {
  const game = normalizeGame(rawGame);
  const imageUrl = safeImageUrl(game.imageUrl);
  const saved = getLocalFavorites().some((favorite) => favorite.id === game.id);
  const players = Number.isFinite(game.minPlayers) && Number.isFinite(game.maxPlayers)
    ? getPlayerLabel(game)
    : "인원 정보 없음";
  const playTime = game.maxPlayTime ? `${game.maxPlayTime}분 이내` : "시간 정보 없음";
  const difficulty = game.complexity ? getDifficultyLabel(game.complexity) : "난이도 정보 없음";
  return `
    <article class="catalog-card" data-game-id="${escapeHtml(game.id)}">
      <div class="catalog-card__image">
        ${imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(game.localizedTitle)} 보드게임 표지" loading="lazy" />`
          : `<span aria-hidden="true">${escapeHtml(game.localizedTitle.slice(0, 1))}</span>`}
      </div>
      <div class="catalog-card__copy">
        <p>${escapeHtml(game.category || "보드게임")}</p>
        <h2>${escapeHtml(game.localizedTitle)}<small>${escapeHtml(game.title || "")}</small></h2>
        <dl><div><dt>인원</dt><dd>${escapeHtml(players)}</dd></div><div><dt>시간</dt><dd>${escapeHtml(playTime)}</dd></div><div><dt>난이도</dt><dd>${escapeHtml(difficulty)}</dd></div></dl>
        ${game.reason ? `<p class="catalog-card__description">${escapeHtml(game.reason)}</p>` : ""}
        <button class="text-link catalog-save" type="button" data-game-id="${escapeHtml(game.id)}">${saved ? "저장됨" : "저장하기"}</button>
      </div>
    </article>`;
};

const load = async ({ reset = false } = {}) => {
  if (loading) return;
  loading = true;
  loadMore.disabled = true;
  status.textContent = reset ? "검색 결과를 불러오고 있습니다…" : "게임 목록을 불러오고 있습니다…";
  if (reset) {
    cursor = null;
    grid.innerHTML = "";
  }

  const page = await fetchPage();
  const items = (page.items ?? []).map(normalizeGame);
  grid.insertAdjacentHTML("beforeend", items.map(renderCard).join(""));
  cursor = page.nextCursor ?? null;
  loadMore.hidden = !page.hasNext;
  loadMore.disabled = false;
  status.textContent = grid.children.length
    ? `${grid.children.length}개의 게임을 보고 있습니다.${page.hasNext ? " 더 불러올 수 있습니다." : " 마지막 게임까지 불러왔습니다."}`
    : "찾는 이름의 게임이 없습니다. 다른 이름으로 검색해 보세요.";
  loading = false;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = queryInput.value.trim();
  load({ reset: true });
});

loadMore.addEventListener("click", () => load());

grid.addEventListener("click", async (event) => {
  const button = event.target.closest(".catalog-save");
  if (!button) return;
  const card = button.closest(".catalog-card");
  const gameId = Number(button.dataset.gameId);
  const localGame = GAMES.find((game) => game.id === gameId);
  const title = card.querySelector("h2").childNodes[0].textContent.trim();
  const game = localGame ?? { id: gameId, title, localizedTitle: title };
  const result = await toggleFavorite(game);
  button.textContent = result.saved ? "저장됨" : "저장하기";
  showToast(result.saved ? `${title} · 저장했습니다` : `${title} · 저장을 해제했습니다`);
});

load({ reset: true });
