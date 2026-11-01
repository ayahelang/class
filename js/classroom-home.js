(function () {
  const status = document.getElementById("status");
  const list = document.getElementById("courseList");
  const empty = document.getElementById("emptyHint");
  const userbar = document.getElementById("userbar");
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");

  function setStatus(t) {
    if (status) status.textContent = t || "";
  }


  async function refreshBanner() {
    var img = document.getElementById("clBannerImg");
    var ph = document.getElementById("clBannerPh");
    var edit = document.getElementById("clBannerEdit");
    var file = document.getElementById("clBannerFile");
    try {
      var url = "";
      if (window.ClassDB && ClassDB.getHomeBannerUrl) url = (await ClassDB.getHomeBannerUrl()) || "";
      if (url && img) {
        img.src = url;
        img.hidden = false;
        if (ph) ph.hidden = true;
      } else {
        if (img) img.hidden = true;
        if (ph) ph.hidden = false;
      }
    } catch (e) {}
    try {
      var can = window.ClassDB && ClassDB.canEditHomeBanner ? await ClassDB.canEditHomeBanner() : false;
      if (edit) {
        edit.hidden = !can;
        edit.style.display = can ? "" : "none";
      }
    } catch (e2) {
      if (edit) edit.hidden = true;
    }
    if (edit && file && !edit.dataset.bound) {
      edit.dataset.bound = "1";
      edit.addEventListener("click", function () {
        file.click();
      });
      file.addEventListener("change", async function () {
        var f = file.files && file.files[0];
        if (!f) return;
        setStatus("Mengunggah banner…");
        try {
          var url = await ClassDB.uploadHomeBanner(f);
          if (img) {
            img.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
            img.hidden = false;
          }
          if (ph) ph.hidden = true;
          setStatus("Banner diperbarui");
        } catch (err) {
          setStatus((err && err.message) || String(err));
        }
        file.value = "";
      });
    }
  }

  async function refreshUser() {
    const session = await ClassDB.getSession();
    if (session && session.user) {
      const u = session.user;
      const meta = u.user_metadata || {};
      const email = u.email || "";
      const name = meta.full_name || meta.name || (email ? email.split("@")[0] : "User");
      const avatar = meta.avatar_url || meta.picture || "";
      if (userbar) {
        userbar.innerHTML =
          (avatar
            ? '<img class="userchip-avatar" src="' + escapeHtml(avatar) + '" alt="" referrerpolicy="no-referrer">'
            : '<span class="userchip-fallback" aria-hidden="true">👤</span>') +
          '<span class="userchip-meta"><b>' +
          escapeHtml(name) +
          "</b><small>" +
          escapeHtml(email) +
          "</small></span>";
        userbar.classList.add("is-logged-in");
      }
      if (btnLogin) {
        btnLogin.hidden = true;
        btnLogin.style.display = "none";
        btnLogin.setAttribute("aria-hidden", "true");
      }
      if (btnLogout) {
        btnLogout.hidden = false;
        btnLogout.style.display = "";
        btnLogout.removeAttribute("aria-hidden");
      }
    } else {
      if (userbar) {
        userbar.textContent = "Belum login";
        userbar.classList.remove("is-logged-in");
      }
      if (btnLogin) {
        btnLogin.hidden = false;
        btnLogin.style.display = "";
        btnLogin.removeAttribute("aria-hidden");
      }
      if (btnLogout) {
        btnLogout.hidden = true;
        btnLogout.style.display = "none";
      }
    }
  }

  async function loadCourses() {
    setStatus("Memuat course…");
    try {
      if (!ClassDB.enabled()) {
        setStatus("Konfigurasi Supabase belum ada.");
        return;
      }
      const rows = await ClassDB.listCourses({ activeOnly: true });
      list.innerHTML = "";
      if (!rows.length) {
        empty.hidden = false;
        setStatus("Belum ada course (atau tabel belum dibuat — jalankan SQL).");
        return;
      }
      empty.hidden = true;
      rows.forEach(function (c) {
        const el = document.createElement("a");
        el.className = "card";
        el.href = "classroom-course.html?id=" + encodeURIComponent(c.id);
        el.style.display = "block";
        el.style.color = "inherit";
        el.style.textDecoration = "none";
        el.innerHTML =
          "<h3>" +
          escapeHtml(c.title) +
          "</h3>" +
          (c.code ? '<div class="meta">' + escapeHtml(c.code) + "</div>" : "") +
          '<p class="muted" style="font-size:13px;margin:8px 0 0">' +
          escapeHtml((c.description || "").slice(0, 120)) +
          "</p>" +
          (c.teacher_name
            ? '<div class="meta" style="margin-top:8px">Pengajar: ' + escapeHtml(c.teacher_name) + "</div>"
            : "");
        list.appendChild(el);
      });
      setStatus(rows.length + " course");
    } catch (e) {
      const msg = (e && e.message) || String(e);
      if (/relation|does not exist|42P01/i.test(msg)) {
        setStatus("Tabel classroom belum ada. Jalankan sql/patch-classroom-phase1-2.sql di Supabase.");
      } else {
        setStatus("Gagal: " + msg);
      }
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (btnLogin) {
    btnLogin.onclick = function () {
      ClassDB.signInWithGoogle().catch(function (e) {
        setStatus(e.message || String(e));
      });
    };
  }
  if (btnLogout) {
    btnLogout.onclick = function () {
      ClassDB.signOut().then(function () {
        location.reload();
      });
    };
  }

  refreshUser().then(function () { refreshBanner(); return loadCourses(); });
  try {
    if (window.ClassDB && ClassDB.onAuthStateChange) {
      ClassDB.onAuthStateChange(function () {
        refreshUser().then(refreshBanner);
      });
    }
  } catch (e) {}
  // OAuth hash/query kadang butuh jeda singkat
  setTimeout(function () {
    refreshUser().then(refreshBanner);
  }, 600);
  setTimeout(function () {
    refreshUser().then(refreshBanner);
  }, 2000);
})();
