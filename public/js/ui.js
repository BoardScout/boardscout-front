import { getSessionUser, logoutAccount } from "./auth.js";

// 모바일 메뉴 버튼의 열기·닫기 동작을 연결합니다.
export function initChrome() {
  initAccountAction();
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

// 페이지가 열려 있는 동안 로그인 여부를 한 번만 확인해 재사용합니다. 로그인하면 페이지가 이동하므로 다시 확인할 필요가 없습니다.
let sessionCheck;
const checkSession = () => (sessionCheck ??= getSessionUser());

// 로그인 안내 팝업입니다. 로그인 화면으로 이동하는 버튼과 닫기 버튼을 보여줍니다.
let loginDialog;
export function showLoginPrompt(message = "이 기능을 사용하려면 로그인해 주세요.") {
  if (!loginDialog) {
    loginDialog = document.createElement("dialog");
    loginDialog.className = "login-prompt";
    loginDialog.setAttribute("aria-labelledby", "loginPromptTitle");
    loginDialog.innerHTML = `
      <h2 id="loginPromptTitle">로그인이 필요해요</h2>
      <p class="login-prompt__text"></p>
      <div class="login-prompt__actions">
        <a class="login-prompt__go" href="/login.html">로그인하러 가기</a>
        <button class="login-prompt__close" type="button" data-close>닫기</button>
      </div>`;
    loginDialog.addEventListener("click", (event) => {
      if (event.target === loginDialog || event.target.closest("[data-close]")) loginDialog.close();
    });
    document.body.append(loginDialog);
  }
  loginDialog.querySelector(".login-prompt__text").textContent = message;
  // 로그인을 마치면 지금 보던 화면으로 돌아오도록 현재 주소를 넘깁니다.
  loginDialog.querySelector(".login-prompt__go").href = `/login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  if (!loginDialog.open) loginDialog.showModal();
}

// 로그인한 사용자만 통과시킵니다. 비로그인이면 안내 팝업을 띄우고 false를 반환합니다.
export async function requireLogin(message) {
  if (await checkSession()) return true;
  showLoginPrompt(message);
  return false;
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

// 헤더 오른쪽의 로그인·로그아웃 버튼을 세션 상태에 맞게 하나만 보여줍니다. 로그인 화면과 가입 화면에서는 로그인 버튼을 두지 않습니다.
async function initAccountAction() {
  const actions = document.querySelector(".header-actions");
  if (!actions) return;
  // 확인이 끝나기 전에 잘못된 버튼이 보이지 않도록 정적으로 적어 둔 버튼을 먼저 치웁니다.
  actions.querySelectorAll('a[href="/login.html"], #logoutButton').forEach((node) => node.remove());
  const user = await getSessionUser();
  const anchor = actions.querySelector(".menu-button");
  if (user) {
    const button = document.createElement("button");
    button.className = "text-button";
    button.id = "logoutButton";
    button.type = "button";
    button.textContent = "로그아웃";
    button.addEventListener("click", async () => {
      await logoutAccount();
      window.location.href = "/";
    });
    actions.insertBefore(button, anchor);
  } else if (!["/login.html", "/register.html"].includes(window.location.pathname)) {
    const link = document.createElement("a");
    link.className = "text-button";
    link.href = "/login.html";
    link.textContent = "로그인";
    actions.insertBefore(link, anchor);
  }
}
