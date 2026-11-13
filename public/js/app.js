import { GAMES, getLocalFavorites, toggleFavorite } from "./recommendations.js";
import { initChrome, initReveal, showToast } from "./ui.js";

initChrome();
initReveal();

const header = document.querySelector("#siteHeader");
const bagCount = document.querySelector("#bagCount");
const rail = document.querySelector("#recommendationRail");
if (bagCount) bagCount.textContent = String(getLocalFavorites().length);
// 첫 화면을 벗어나면 헤더를 상단에 고정해 주요 메뉴 접근을 유지합니다.
window.addEventListener("scroll", () => header?.classList.toggle("is-fixed", window.scrollY > 90));

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

document.querySelectorAll(".product-card .quick-add").forEach((button) => {
  button.addEventListener("click", async () => {
    const game = GAMES.find(({ id }) => id === Number(button.dataset.gameId));
    if (!game) return;
    const { saved, favorites } = await toggleFavorite(game);
    button.firstChild.textContent = saved ? "저장됨 " : "저장하기 ";
    if (bagCount) bagCount.textContent = String(favorites.length);
    showToast(saved ? `${game.title} · 저장했습니다` : `${game.title} · 저장을 해제했습니다`);
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
document.querySelector("#searchClose")?.addEventListener("click", () => {
  searchPanel.hidden = true;
  document.body.classList.remove("is-locked");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchPanel && !searchPanel.hidden) {
    searchPanel.hidden = true;
    document.body.classList.remove("is-locked");
  }
});
