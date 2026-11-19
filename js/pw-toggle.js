/** Toggle mata untuk semua input password (default tersembunyi) */
(function (global) {
  var EYE_SHOW =
    '<svg class="sh-pw-ico-show" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_HIDE =
    '<svg class="sh-pw-ico-hide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function enhance(input) {
    if (!input || input.dataset.shPwToggle === "1") return;
    if (input.type !== "password" && input.getAttribute("data-sh-pw") !== "1") return;
    if (input.parentElement && input.parentElement.classList.contains("sh-pw-wrap")) {
      input.dataset.shPwToggle = "1";
      return;
    }
    input.dataset.shPwToggle = "1";
    if (input.type !== "password") input.type = "password";
    input.classList.add("sh-pw-input");
    var wrap = document.createElement("div");
    wrap.className = "sh-pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sh-pw-toggle";
    btn.setAttribute("aria-label", "Tampilkan password");
    btn.setAttribute("title", "Tampilkan / sembunyikan password");
    btn.innerHTML = EYE_SHOW + EYE_HIDE;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.classList.toggle("is-shown", show);
      btn.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
      try {
        input.focus();
      } catch (err) {}
    });
    wrap.appendChild(btn);
  }

  function scan(root) {
    root = root || document;
    try {
      root.querySelectorAll('input[type="password"], input[data-sh-pw="1"]').forEach(enhance);
    } catch (e) {}
  }

  function boot() {
    scan(document);
    try {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches('input[type="password"]')) enhance(n);
            else if (n.querySelectorAll) scan(n);
          });
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e2) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  global.SHPasswordToggle = { enhance: enhance, scan: scan };
})(typeof window !== "undefined" ? window : this);
