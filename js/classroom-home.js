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

  async function refreshUser() {
    const session = await ClassDB.getSession();
    if (session && session.user) {
      const email = session.user.email || "";
      userbar.textContent = email;
      btnLogin.hidden = true;
      btnLogout.hidden = false;
    } else {
      userbar.textContent = "Belum login";
      btnLogin.hidden = false;
      btnLogout.hidden = true;
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

  refreshUser().then(loadCourses);
})();
