import { coreApi } from "../api.js";
import { GAMES, getDifficultyLabel, getLocalFavorites, getPlayerLabel, toggleFavorite } from "../recommendations.js";
import { initChrome, showToast } from "../ui.js";
import { bindStarRatings, getDatasetItemId, loadRatings, starRatingHtml } from "../star-rating.js";
import { getKoGame, getGameImage } from "../game-catalog-ko.js";

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

// innerHTML에 넣을 문자열의 특수문자를 이스케이프해 태그가 삽입되지 않게 합니다.
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

// http·https 주소만 허용하고, 그 밖의 주소나 잘못된 값은 null로 처리합니다.
const safeImageUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

// 서버 응답과 내장 데이터의 필드 이름 차이를 맞추고, 한국어 소개가 있으면 그 내용으로 덮어씁니다.
const normalizeGame = (game) => {
  const ko = getKoGame(game.bggId);
  const image = ko ? getGameImage(game.bggId) : null;
  return {
  ...game,
  title: game.nameEn ?? game.title,
  localizedTitle: game.nameKo || game.localizedTitle || game.nameEn || game.title,
  maxPlayTime: game.maxPlayTimeMinutes ?? game.maxPlayTime,
  complexity: Number(game.difficulty ?? game.complexity ?? 0),
  imageUrl: game.thumbnailUrl ?? game.imageUrl,
  reason: game.descriptionKo ?? game.reason,
  ...(ko ? {
    localizedTitle: ko.nameKo,
    reason: ko.description,
    playSummary: ko.playSummary,
    designer: ko.designer,
    publisher: ko.publisher,
    ...(image ? { imageUrl: image } : {}),
  } : {}),
  };
};

// 카드를 그릴 때 게임 정보를 보관했다가 상세 창에서 id로 다시 찾습니다.
const gamesById = new Map();

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
    return localPage(activeQuery, cursor);
  }
};

// 게임 한 건을 카탈로그 카드 HTML 문자열로 만듭니다.
const renderCard = (rawGame) => {
  const game = normalizeGame(rawGame);
  gamesById.set(Number(game.id), game);
  const imageUrl = safeImageUrl(game.imageUrl);
  const saved = getLocalFavorites().some((favorite) => favorite.id === game.id);
  const players = Number.isFinite(game.minPlayers) && Number.isFinite(game.maxPlayers)
    ? getPlayerLabel(game)
    : "인원 정보 없음";
  const playTime = game.maxPlayTime ? `${game.maxPlayTime}분 이내` : "시간 정보 없음";
  const difficulty = game.complexity ? getDifficultyLabel(game.complexity) : "난이도 정보 없음";
  return `
    <article class="catalog-card" data-game-id="${escapeHtml(game.id)}">
      <div class="catalog-card__image" data-open-detail role="button" tabindex="0" aria-label="${escapeHtml(game.localizedTitle)} 상세 보기">
        ${imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(game.localizedTitle)} 보드게임 표지" loading="lazy" />`
          : `<span aria-hidden="true">${escapeHtml(game.localizedTitle.slice(0, 1))}</span>`}
      </div>
      <div class="catalog-card__copy">
        <h2 data-open-detail role="button" tabindex="0">${escapeHtml(game.localizedTitle)}<small>${escapeHtml(game.title || "")}</small></h2>
        ${starRatingHtml(game.id, game.localizedTitle, savedRatings.get(getDatasetItemId(game)))}
        <p class="catalog-card__facts">${[game.category, players, playTime, difficulty].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</p>
        ${game.reason ? `<p class="catalog-card__description">${escapeHtml(game.reason)}</p>` : ""}
        <button class="save-game catalog-save" type="button" data-game-id="${escapeHtml(game.id)}" aria-pressed="${saved}">${saved ? "관심 등록됨" : "관심 등록"}</button>
      </div>
    </article>`;
};

// 현재 검색어와 커서로 게임 목록을 불러와 그리드에 붙입니다. reset이면 목록을 비우고 처음부터 불러옵니다.
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

// 게임 상세 정보를 보여줄 모달 창입니다. 바깥 영역이나 닫기 버튼을 누르면 닫힙니다.
const dialog = document.createElement("dialog");
dialog.className = "game-dialog";
document.body.append(dialog);
dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.closest("[data-close]")) dialog.close(); });

// 게임의 상세 정보를 모달 창에 채워 넣고 엽니다.
const openDetail = (game) => {
  const image = safeImageUrl(game.imageUrl);
  const players = Number.isFinite(game.minPlayers) ? getPlayerLabel(game) : "정보 없음";
  const rows = [
    ["인원", players],
    ["시간", game.maxPlayTime ? `약 ${game.maxPlayTime}분` : "정보 없음"],
    ["권장 연령", game.minAge ? `${game.minAge}세 이상` : "정보 없음"],
    ["난이도", game.complexity ? getDifficultyLabel(game.complexity) : "정보 없음"],
    ["출시", game.yearPublished ? `${game.yearPublished}년` : "정보 없음"],
  ];
  dialog.innerHTML = `
    <button class="game-dialog__close" type="button" data-close aria-label="닫기">×</button>
    <div class="game-dialog__image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(game.localizedTitle)} 표지" />` : `<span aria-hidden="true">${escapeHtml(game.localizedTitle.slice(0, 1))}</span>`}</div>
    <div class="game-dialog__body">
      <p class="game-dialog__eyebrow">${escapeHtml(game.category || "보드게임")}</p>
      <h2>${escapeHtml(game.localizedTitle)}</h2>
      <p class="game-dialog__original">${escapeHtml(game.title || "")}</p>
      <dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join("")}</dl>
      ${game.reason ? `<p class="game-dialog__lead">${escapeHtml(game.reason)}</p>` : ""}
      ${game.playSummary ? `<h3>어떻게 하나요?</h3><p>${escapeHtml(game.playSummary)}</p>` : ""}
      ${game.designer ? `<h3>만든 사람</h3><p>디자이너 ${escapeHtml(game.designer)}<br />출판사 ${escapeHtml(game.publisher || "")}</p>` : ""}
    </div>`;
  dialog.showModal();
};

// 카드의 이미지나 제목을 누르면 상세 창을 엽니다.
grid.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-detail]");
  if (!trigger) return;
  const game = gamesById.get(Number(trigger.closest(".catalog-card").dataset.gameId));
  if (game) openDetail(game);
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

// 더 보기 버튼을 누르면 다음 페이지를 이어서 불러옵니다.
loadMore.addEventListener("click", () => load());

// 카드의 저장 버튼으로 게임을 저장 목록에 넣거나 뺍니다.
grid.addEventListener("click", async (event) => {
  const button = event.target.closest(".catalog-save");
  if (!button) return;
  const card = button.closest(".catalog-card");
  const gameId = Number(button.dataset.gameId);
  const localGame = GAMES.find((game) => game.id === gameId);
  const title = card.querySelector("h2").childNodes[0].textContent.trim();
  const game = localGame ?? { id: gameId, title, localizedTitle: title };
  const result = await toggleFavorite(game);
  button.textContent = result.saved ? "관심 등록됨" : "관심 등록";
  button.setAttribute("aria-pressed", String(result.saved));
  showToast(result.saved ? `${title} · 관심 등록했습니다` : `${title} · 관심 등록을 해제했습니다`);
});

// 별 입력은 이벤트 위임으로 처리해, 나중에 붙는 카드도 한 번만 연결합니다.
bindStarRatings(grid, (group) => gamesById.get(Number(group.dataset.uid)), savedRatings);

// 페이지에 들어오면 첫 페이지를 바로 불러옵니다.
load({ reset: true });
