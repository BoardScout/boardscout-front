import { GAMES, getLocalFavorites, toggleFavorite } from "./recommendations.js";
import { initChrome, initReveal, showToast } from "./ui.js";

initChrome();
initReveal();

const header = document.querySelector("#siteHeader");
const bagCount = document.querySelector("#bagCount");
if (bagCount) bagCount.textContent = String(getLocalFavorites().length);
window.addEventListener("scroll", () => header?.classList.toggle("is-fixed", window.scrollY > 90));

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".product-card").forEach((card) => {
      card.classList.toggle("is-hidden", filter !== "all" && card.dataset.category !== filter);
    });
  });
});

document.querySelectorAll(".quick-add").forEach((button, index) => {
  button.addEventListener("click", async () => {
    const { saved, favorites } = await toggleFavorite(GAMES[index]);
    button.firstChild.textContent = saved ? "저장됨 " : "저장하기 ";
    if (bagCount) bagCount.textContent = String(favorites.length);
    showToast(saved ? `${GAMES[index].title} · 저장했습니다` : `${GAMES[index].title} · 저장을 해제했습니다`);
  });
});

const searchPanel = document.querySelector("#searchPanel");
const searchInput = document.querySelector("#searchInput");
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
