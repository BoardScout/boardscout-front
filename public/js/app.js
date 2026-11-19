import { GAMES, getLocalFavorites, toggleFavorite } from "./recommendations.js";
import { initChrome, initReveal, requireLogin, showToast } from "./ui.js";

initChrome();
initReveal();

const header = document.querySelector("#siteHeader");
const bagCount = document.querySelector("#bagCount");
const rail = document.querySelector("#recommendationRail");
// 저장한 게임 개수를 헤더의 가방 숫자로 표시합니다.
if (bagCount) bagCount.textContent = String(getLocalFavorites().length);
// 첫 화면을 벗어나면 헤더를 상단에 고정해 주요 메뉴 접근을 유지합니다.
window.addEventListener("scroll", () => header?.classList.toggle("is-fixed", window.scrollY > 90));

// 카테고리 필터 버튼을 누르면 해당 분류의 카드만 남기고 나머지는 숨깁니다.
document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".product-card").forEach((card) => {
      const categories = card.dataset.category?.split(" ") ?? [];
      card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
    });
    if (rail) rail.scrollLeft = 0;
  });
});

// 카드의 저장 버튼으로 저장 여부를 바꾸고, 버튼 문구와 저장 개수를 갱신합니다.
document.querySelectorAll(".product-card .quick-add").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!(await requireLogin("관심 게임으로 등록하려면 로그인해 주세요."))) return;
    const game = GAMES.find(({ id }) => id === Number(button.dataset.gameId));
    if (!game) return;
    const { saved, favorites } = await toggleFavorite(game);
    button.firstChild.textContent = saved ? "관심 등록됨 " : "관심 등록 ";
    if (bagCount) bagCount.textContent = String(favorites.length);
    showToast(saved ? `${game.title} · 관심 등록했습니다` : `${game.title} · 관심 등록을 해제했습니다`);
  });
});

const searchPanel = document.querySelector("#searchPanel");
const searchInput = document.querySelector("#searchInput");
// 검색 패널이 열려 있는 동안 본문 스크롤을 잠그고 입력창으로 초점을 이동합니다.
document.querySelector("#searchOpen")?.addEventListener("click", () => {
  searchPanel.hidden = false;
  document.body.classList.add("is-locked");
  window.setTimeout(() => searchInput.focus(), 20);
});
// 닫기 버튼을 누르면 검색 패널을 숨기고 본문 스크롤 잠금을 풉니다.
document.querySelector("#searchClose")?.addEventListener("click", () => {
  searchPanel.hidden = true;
  document.body.classList.remove("is-locked");
});
// Esc 키로도 열려 있는 검색 패널을 닫을 수 있게 합니다.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchPanel && !searchPanel.hidden) {
    searchPanel.hidden = true;
    document.body.classList.remove("is-locked");
  }
});
