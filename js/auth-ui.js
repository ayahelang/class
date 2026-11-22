/** Topbar auth: sembunyikan Login Google saat mode database primer (tanpa cloud) */
(function () {
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function googleLoginAllowed() {
    try {
      if (window.SHSheetsBackend) {
        var m = SHSheetsBackend.getMode() || "sheets";
        if (m === "supabase" || m === "firebase") return true;
        return !!SHSheetsBackend.supabaseAllowed();
      }
      var c = window.SH_DB_BACKEND_CONFIG;
      if (c) {
        var p = c.primary || "sheets";
        if (p === "supabase" || p === "firebase") return true;
        return !!c.allowSupabase;
      }
    } catch (e) {}
    // Tanpa config Class: tampilkan Login (kompatibel webgal)
    return true;
  }

  function placeUserbar(bar) {
    const topbar = $(".topbar");
    if (!topbar) return;
    bar.classList.add("sh-userbar");
    bar.id = bar.id || "shUserbar";
    if (bar.parentNode === topbar) return;
    const slot = $("#shUserbar");
    if (slot && slot !== bar && slot.parentNode === topbar) {
      slot.replaceWith(bar);
      return;
    }
    topbar.appendChild(bar);
  }

  function hideAdminNavLinks(hide) {
    document.querySelectorAll("a.nav-admin").forEach(function (a) {
      // Di halaman admin, biarkan Admin terlihat sebagai navigasi aktif
      if (a.classList.contains("active")) {
        a.removeAttribute("hidden");
        a.style.display = "";
        return;
      }
      if (hide) {
        a.setAttribute("hidden", "");
        a.style.display = "none";
      } else {
        a.removeAttribute("hidden");
        a.style.display = "";
      }
    });
  }

  async function ensureProfileBar() {
    if (!window.GalleryDB || !GalleryDB.enabled) {
      // tetap coba render bar kosong / tanpa login
    }
    let bar = $(".sh-userbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "sh-userbar";
      placeUserbar(bar);
    } else {
      placeUserbar(bar);
    }

    try {
      var session = null;
      try {
        if (window.GalleryDB && GalleryDB.getSession) session = await GalleryDB.getSession();
      } catch (e0) {}

      if (!session || !session.user) {
        document.body.classList.remove("sh-user-logged");
        document.body.classList.add("sh-user-guest");
        // Selalu tampilkan Login (modal password). Jangan disembunyikan di mode Sheet.
        bar.hidden = false;
        bar.removeAttribute("aria-hidden");
        hideAdminNavLinks(false);
        bar.innerHTML =
          '<a class="btn-google-sm" href="profile.html?login=1" title="Login" id="shTopLogin">' +
          '<span class="g-icon" aria-hidden="true"></span> Login</a>';
        var btn = bar.querySelector("#shTopLogin");
        if (btn) {
          btn.addEventListener("click", function () {
            try {
              sessionStorage.setItem("sh_return", location.href);
            } catch (err) {}
          });
        }
        return;
      }

      document.body.classList.add("sh-user-logged");
      document.body.classList.remove("sh-user-guest");
      bar.hidden = false;
      bar.removeAttribute("aria-hidden");

      const u = session.user;
      const meta = u.user_metadata || {};
      const avatar = meta.avatar_url || meta.picture || "";
      const name = meta.full_name || meta.name || (u.email || "User").split("@")[0];
      try {
        if (GalleryDB.upsertMyProfileFromSession) await GalleryDB.upsertMyProfileFromSession();
      } catch (e) {}
      let statusLabel = "User";
      try {
        const prof = await GalleryDB.getMyProfile();
        if (prof && prof.linked_angkatan_year && window.SHStatus) {
          statusLabel = SHStatus.compute(prof.linked_angkatan_year).label;
        }
      } catch (e) {}
      let isAdm = false;
      try {
        isAdm = await GalleryDB.isCurrentUserAdmin();
      } catch (e) {}

      hideAdminNavLinks(!!isAdm);

      const href = isAdm ? "admin.html" : "profile.html";
      const title = isAdm ? "Panel Admin · " + name : name;
      const sub = isAdm ? "Admin" : statusLabel;
      bar.innerHTML =
        '<a class="sh-profile-chip' +
        (isAdm ? " is-admin" : "") +
        '" href="' +
        href +
        '" title="' +
        escapeHtml(title) +
        '">' +
        (avatar
          ? '<img src="' + escapeHtml(avatar) + '" alt="">'
          : '<span class="sh-av-fallback">👤</span>') +
        '<span class="sh-profile-meta"><b>' +
        escapeHtml(name) +
        "</b><small>" +
        escapeHtml(sub) +
        "</small></span></a>";
    } catch (e) {
      console.warn(e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureProfileBar);
  } else {
    ensureProfileBar();
  }
  setTimeout(ensureProfileBar, 100);
  setTimeout(ensureProfileBar, 600);
  window.SHAuthUI = { refresh: ensureProfileBar };
})();
