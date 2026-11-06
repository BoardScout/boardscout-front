import { GAMES, getLocalFavorites, toggleFavorite } from "./recommendations.js";
import { initChrome, initReveal, showToast } from "./ui.js";

initChrome();
initReveal();

const header = document.querySelector("#siteHeader");
const bagCount = document.querySelector("#bagCount");
const rail = document.querySelector("#recommendationRail");
const track = rail?.querySelector(".product-track");
const railToggle = document.querySelector("#railToggle");
if (bagCount) bagCount.textContent = String(getLocalFavorites().length);
window.addEventListener("scroll", () => header?.classList.toggle("is-fixed", window.scrollY > 90));

const originalCards = track ? [...track.children] : [];
originalCards.forEach((card) => {
  const clone = card.cloneNode(true);
  clone.classList.add("product-card--clone");
  clone.classList.remove("reveal");
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("a, button").forEach((control) => control.setAttribute("tabindex", "-1"));
  track.append(clone);
});

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

document.querySelectorAll(".product-card:not(.product-card--clone) .quick-add").forEach((button) => {
  button.addEventListener("click", async () => {
    const game = GAMES.find(({ id }) => id === Number(button.dataset.gameId));
    if (!game) return;
    const { saved, favorites } = await toggleFavorite(game);
    button.firstChild.textContent = saved ? "저장됨 " : "저장하기 ";
    if (bagCount) bagCount.textContent = String(favorites.length);
    showToast(saved ? `${game.title} · 저장했습니다` : `${game.title} · 저장을 해제했습니다`);
  });
});

if (rail && track && originalCards.length && railToggle) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let manuallyPaused = reducedMotion.matches;
  let interactionPaused = false;
  let visible = true;
  let previousTime = 0;

  const updateToggle = () => {
    railToggle.setAttribute("aria-pressed", String(manuallyPaused));
    railToggle.textContent = manuallyPaused ? "자동 넘김 시작하기" : "자동 넘김 멈추기";
  };
  updateToggle();

  railToggle.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    updateToggle();
  });
  rail.addEventListener("pointerenter", () => { interactionPaused = true; });
  rail.addEventListener("pointerleave", () => { interactionPaused = false; });
  rail.addEventListener("focusin", () => { interactionPaused = true; });
  rail.addEventListener("focusout", (event) => {
    if (!rail.contains(event.relatedTarget)) interactionPaused = false;
  });
  reducedMotion.addEventListener("change", (event) => {
    manuallyPaused = event.matches;
    updateToggle();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.1 }).observe(rail);

  const advanceRail = (time) => {
    const elapsed = Math.min(time - previousTime, 50);
    previousTime = time;
    if (!manuallyPaused && !interactionPaused && visible && !document.hidden) {
      rail.scrollLeft += elapsed * 0.018;
      const loopPoint = track.scrollWidth / 2;
      if (rail.scrollLeft >= loopPoint) rail.scrollLeft -= loopPoint;
    }
    window.requestAnimationFrame(advanceRail);
  };
  window.requestAnimationFrame((time) => {
    previousTime = time;
    window.requestAnimationFrame(advanceRail);
  });
}

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
