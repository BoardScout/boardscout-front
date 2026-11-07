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
// 첫 화면을 벗어나면 헤더를 상단에 고정해 주요 메뉴 접근을 유지합니다.
window.addEventListener("scroll", () => header?.classList.toggle("is-fixed", window.scrollY > 90));

// 카드 묶음을 한 번 복제해 스크롤 위치를 되감아도 끊김 없는 순환처럼 보이게 합니다.
const originalCards = track ? [...track.children] : [];
originalCards.forEach((card) => {
  const clone = card.cloneNode(true);
  clone.classList.add("product-card--clone");
  clone.classList.remove("reveal");
  // 복제 카드는 시각적 연속성만 담당하므로 접근성과 키보드 탐색에서 제외합니다.
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("a, button").forEach((control) => control.setAttribute("tabindex", "-1"));
  track.append(clone);
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const filter = button.dataset.filter;
    // 원본과 복제 카드에 같은 필터를 적용해 순환 중에도 결과가 일치하도록 합니다.
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
  // 모션 감소 설정, 사용자 조작, 화면 노출 여부를 각각 추적해 자동 이동을 제어합니다.
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
    // 백그라운드 복귀 시 큰 폭으로 튀지 않도록 한 프레임의 이동 시간을 제한합니다.
    const elapsed = Math.min(time - previousTime, 50);
    previousTime = time;
    if (!manuallyPaused && !interactionPaused && visible && !document.hidden) {
      rail.scrollLeft += elapsed * 0.018;
      // 복제 카드가 시작되는 지점에서 같은 위치만큼 되감아 자연스럽게 반복합니다.
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
