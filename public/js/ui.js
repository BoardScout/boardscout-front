// 모바일 메뉴 버튼의 열기·닫기 동작을 연결합니다.
export function initChrome() {
  const menuButton = document.querySelector("#menuButton");
  const nav = document.querySelector(".main-nav");
  if (!menuButton || !nav) return;
  // 모바일 메뉴가 열릴 때 배경 스크롤을 잠그고 접근성 상태를 함께 갱신합니다.
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    document.body.classList.toggle("is-locked", isOpen);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }));
}

// 짧은 안내 메시지를 약 2.2초 동안 보여줍니다.
export function showToast(message) {
  // 토스트가 없는 하위 페이지에서도 같은 피드백 함수를 사용할 수 있도록 필요할 때 생성합니다.
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

// .reveal 요소가 화면에 들어올 때 나타나는 효과를 적용합니다.
export function initReveal() {
  // IntersectionObserver 미지원 환경에서는 콘텐츠를 숨기지 않고 즉시 표시합니다.
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // 한 번 나타난 요소는 다시 관찰하지 않아 불필요한 콜백을 줄입니다.
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}
