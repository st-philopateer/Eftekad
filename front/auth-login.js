(function () {
  const STORAGE_KEY = "authTheme";

  function applyAuthTheme(theme) {
    const auth = document.getElementById("authSection");
    if (!auth) return;

    auth.dataset.authTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    const btn = document.getElementById("authThemeToggle");
    if (!btn) return;

    if (theme === "light") {
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      btn.setAttribute("aria-label", "التبديل للوضع الداكن");
      btn.title = "الوضع الداكن";
    } else {
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      btn.setAttribute("aria-label", "التبديل للوضع الفاتح");
      btn.title = "الوضع الفاتح";
    }
  }

  window.toggleAuthPass = function (inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const isPass = inp.type === "password";
    inp.type = isPass ? "text" : "password";
    btn.innerHTML = isPass
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    btn.style.color = isPass ? "rgba(201,168,76,0.7)" : "";
  };

  document.addEventListener("DOMContentLoaded", function () {
    const saved = localStorage.getItem(STORAGE_KEY) || "dark";
    applyAuthTheme(saved);

    const btn = document.getElementById("authThemeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        const auth = document.getElementById("authSection");
        const current = auth && auth.dataset.authTheme === "light" ? "light" : "dark";
        applyAuthTheme(current === "dark" ? "light" : "dark");
      });
    }
  });
})();
