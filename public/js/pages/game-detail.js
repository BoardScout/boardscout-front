import { GAMES, getDifficultyLabel, getLocalFavorites } from "../recommendations.js";
import { initChrome } from "../ui.js";

initChrome();

const params = new URLSearchParams(window.location.search);
const requestedId = Number(params.get("id"));
const game = GAMES.find(({ id }) => id === requestedId);
const container = document.querySelector("#gameDetail");
const bagCount = document.querySelector("#bagCount");

if (bagCount) bagCount.textContent = String(getLocalFavorites().length);

if (!game?.description || !game?.imageUrl) {
  container.innerHTML = `<div class="game-detail__error"><div><h1>게임을 찾지 못했습니다</h1><p>메인 화면에서 소개된 게임을 다시 선택해 주세요.</p><a class="game-detail__back" href="/index.html#new">오늘의 게임으로 돌아가기</a></div></div>`;
} else {
  document.title = `${game.localizedTitle} — BOARDSCOUT`;
  const playerCount = game.minPlayers === game.maxPlayers ? `${game.minPlayers}인` : `${game.minPlayers}–${game.maxPlayers}인`;
  container.innerHTML = `
    <a class="game-detail__back" href="/index.html#new">← 오늘의 게임으로 돌아가기</a>
    <div class="game-detail__layout">
      <img class="game-detail__cover" src="${game.imageUrl}" alt="${game.localizedTitle} 보드게임 박스 표지" />
      <article>
        <p class="game-detail__eyebrow">${game.category} · ${game.year}</p>
        <h1>${game.localizedTitle}</h1>
        <p class="game-detail__original">${game.title}</p>
        <dl class="game-detail__facts">
          <div><dt>인원</dt><dd>${playerCount}</dd></div>
          <div><dt>시간</dt><dd>약 ${game.maxPlayTime}분</dd></div>
          <div><dt>권장 연령</dt><dd>${game.minAge}세 이상</dd></div>
          <div><dt>난이도</dt><dd>${getDifficultyLabel(game.complexity)}</dd></div>
        </dl>
        <p class="game-detail__lead">${game.description}</p>
        <section class="game-detail__section"><h2>어떻게 하나요?</h2><p>${game.playSummary}</p></section>
        <section class="game-detail__section"><h2>만든 사람</h2><p>디자이너 ${game.designer}<br />출판사 ${game.publisher}</p></section>
        <a class="game-detail__source" href="https://boardgamegeek.com/boardgame/${game.bggId}" target="_blank" rel="noopener noreferrer">이미지와 게임 정보 출처: BoardGameGeek ↗</a>
      </article>
    </div>`;
}
