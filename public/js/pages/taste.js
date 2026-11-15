import { coreApi } from "../api.js";
import { GAMES, getDifficultyLabel, getPreferences, savePreferences } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();
const PAGE_SIZE = 50;
const form = document.querySelector("#tasteForm");
const picker = document.querySelector("#gamePicker");
const search = document.querySelector("#gameSearch");
const count = document.querySelector("#selectedCount");
const submit = document.querySelector("#tasteSubmit");
const message = document.querySelector("#formMessage");
const loadMore = document.querySelector("#loadMore");
const current = await getPreferences();
// 검색으로 목록이 다시 렌더링돼도 선택이 유지되도록 DOM 밖의 Set에 상태를 보관합니다.
const selected = new Set(current?.recommendationMode === "taste" ? current.likedGameIds : []);
let cursor = null;
let activeQuery = "";
let loading = false;
let requestSequence = 0;

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const normalizeGame = (game) => ({
  datasetItemId: game.datasetItemId === null
    ? Number.NaN
    : Number(game.datasetItemId ?? game.id),
  title: game.nameEn ?? game.title ?? "",
  localizedTitle: game.nameKo || game.localizedTitle || game.nameEn || game.title || "",
  category: game.category || "보드게임",
  complexity: Number(game.difficulty ?? game.complexity ?? 0),
  maxPlayTime: Number(game.maxPlayTimeMinutes ?? game.maxPlayTime ?? 0),
});

const localPage = (query) => {
  const keyword = query.trim().toLocaleLowerCase("ko");
  const items = GAMES.filter((game) => !keyword
    || game.title.toLowerCase().includes(keyword)
    || game.localizedTitle.includes(keyword));
  return { items, hasNext: false, nextCursor: null };
};

const renderGames = (games, { append = false } = {}) => {
  const html = games.map(normalizeGame)
    .filter((game) => Number.isInteger(game.datasetItemId) && game.datasetItemId >= 0)
    .map((game) => `
    <label class="game-choice">
      <input type="checkbox" value="${game.datasetItemId}" ${selected.has(game.datasetItemId) ? "checked" : ""} />
      <span><b>${escapeHtml(game.localizedTitle)}</b><small>${escapeHtml(game.title)}</small><em>${escapeHtml(game.category)} · ${game.complexity ? getDifficultyLabel(game.complexity) : "난이도 정보 없음"} · ${game.maxPlayTime ? `${game.maxPlayTime}분` : "시간 정보 없음"}</em></span>
    </label>
  `).join("");
  if (append) picker.insertAdjacentHTML("beforeend", html);
  else picker.innerHTML = html;
};

const load = async ({ reset = false } = {}) => {
  if (loading && !reset) return;
  const sequence = ++requestSequence;
  loading = true;
  loadMore.disabled = true;
  message.textContent = reset ? "검색 결과를 불러오고 있습니다…" : "게임 목록을 불러오고 있습니다…";
  if (reset) {
    cursor = null;
    picker.innerHTML = "";
  }

  let page;
  try {
    const payload = await coreApi.browseBoardGames(activeQuery, cursor, PAGE_SIZE);
    page = payload.result ?? payload;
  } catch {
    page = localPage(activeQuery);
  }
  if (sequence !== requestSequence) return;

  const items = page.items ?? [];
  renderGames(items, { append: !reset });
  cursor = page.nextCursor ?? null;
  loadMore.hidden = !page.hasNext;
  loadMore.disabled = false;
  message.textContent = picker.children.length
    ? `${picker.children.length}개의 게임을 보고 있습니다.${page.hasNext ? " 더 불러올 수 있습니다." : ""}`
    : "찾는 이름의 게임이 없습니다.";
  loading = false;
};

const updateState = () => {
  // 취향 프로필에 필요한 최소 선택 수를 만족할 때만 제출을 허용합니다.
  count.textContent = String(selected.size);
  submit.disabled = selected.size < 3;
};

picker.addEventListener("change", (event) => {
  // 이벤트 위임으로 동적으로 생성된 체크박스의 선택 상태를 한곳에서 관리합니다.
  const gameId = Number(event.target.value);
  if (event.target.checked && selected.size >= 20) {
    event.target.checked = false;
    message.textContent = "게임은 최대 20개까지 선택할 수 있습니다.";
  } else if (event.target.checked) {
    selected.add(gameId);
  } else {
    selected.delete(gameId);
  }
  updateState();
});
let searchTimer;
search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    activeQuery = search.value.trim();
    load({ reset: true });
  }, 250);
});
loadMore.addEventListener("click", () => load());
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (selected.size < 3) {
    message.textContent = "좋아했던 게임을 3개 이상 골라주세요.";
    return;
  }
  message.textContent = "선택한 게임에서 취향의 공통점을 찾고 있습니다…";
  await savePreferences({ recommendationMode: "taste", likedGameIds: [...selected] });
  window.location.href = "/recommendations.html";
});

updateState();
load({ reset: true });
