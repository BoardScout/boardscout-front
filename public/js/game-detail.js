import { getDifficultyLabel, getPlayerLabel } from "./recommendations.js";
import { displayTitle, toViewGame } from "./game-model.js";

// innerHTML에 넣을 문자열의 특수문자를 이스케이프해 태그가 삽입되지 않게 합니다.
export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

// http·https 주소만 허용하고, 그 밖의 주소나 잘못된 값은 null로 처리합니다.
export const safeImageUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

// 게임 상세 정보를 보여줄 모달 창입니다. 바깥 영역이나 닫기 버튼을 누르면 닫힙니다.
const dialog = document.createElement("dialog");
dialog.className = "game-dialog";
document.body.append(dialog);
dialog.addEventListener("click", (event) => { if (event.target === dialog || event.target.closest("[data-close]")) dialog.close(); });

// 게임의 상세 정보를 모달 창에 채워 넣고 엽니다.
export const openGameDetail = (rawGame) => {
  const game = toViewGame(rawGame);
  const title = displayTitle(game);
  const image = safeImageUrl(game.imageUrl);
  const players = Number.isFinite(game.minPlayers) ? getPlayerLabel(game) : "정보 없음";
  const rows = [
    ["인원", players],
    ["시간", game.maxPlayTime ? `약 ${game.maxPlayTime}분` : "정보 없음"],
    ["권장 연령", game.minAge ? `${game.minAge}세 이상` : "정보 없음"],
    ["난이도", game.complexity ? getDifficultyLabel(game.complexity) : "정보 없음"],
    ["출시", game.year ? `${game.year}년` : "정보 없음"],
  ];
  dialog.innerHTML = `
    <button class="game-dialog__close" type="button" data-close aria-label="닫기">×</button>
    <div class="game-dialog__image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)} 표지" />` : `<span aria-hidden="true">${escapeHtml(title.slice(0, 1))}</span>`}</div>
    <div class="game-dialog__body">
      <p class="game-dialog__eyebrow">${escapeHtml(game.category || "보드게임")}</p>
      <h2>${escapeHtml(title)}</h2>
      <p class="game-dialog__original">${escapeHtml(game.title || "")}</p>
      <dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join("")}</dl>
      ${(game.description ?? game.reason) ? `<p class="game-dialog__lead">${escapeHtml(game.description ?? game.reason)}</p>` : ""}
      ${game.playSummary ? `<h3>어떻게 하나요?</h3><p>${escapeHtml(game.playSummary)}</p>` : ""}
      ${game.designer ? `<h3>만든 사람</h3><p>디자이너 ${escapeHtml(game.designer)}<br />출판사 ${escapeHtml(game.publisher || "")}</p>` : ""}
    </div>`;
  dialog.showModal();
};

