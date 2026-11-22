/**
 * Login modal: Angkatan → Nama → Password (default Bismillaah)
 */
(function () {
  var directory = null;
  var modal = null;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "shLoginModal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="sh-login-backdrop" data-close="1"></div>' +
      '<div class="sh-login-panel" role="dialog" aria-labelledby="shLoginTitle">' +
      '  <button type="button" class="sh-login-x" data-close="1" aria-label="Tutup">×</button>' +
      '  <h2 id="shLoginTitle">Login</h2>' +
      '  <p class="muted" style="font-size:13px;margin:0 0 12px">Pilih angkatan, nama, lalu password. Password awal: <b>Bismillaah</b></p>' +
      '  <label class="field"><span>Angkatan</span>' +
      '    <select id="shLoginAngkatan" style="width:100%"><option value="">— memuat —</option></select>' +
      "  </label>" +
      '  <label class="field"><span>Nama</span>' +
      '    <select id="shLoginName" style="width:100%" disabled><option value="">— pilih angkatan dulu —</option></select>' +
      "  </label>" +
      '  <label class="field"><span>Password</span>' +
      '    <input type="password" id="shLoginPw" autocomplete="current-password" style="width:100%" placeholder="Bismillaah">' +
      "  </label>" +
      '  <p id="shLoginErr" class="muted" style="color:#f5a;" hidden></p>' +
      '  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
      '    <button type="button" class="btn btn-primary" id="shLoginGo">Masuk</button>' +
      '    <button type="button" class="btn btn-ghost" data-close="1">Batal</button>' +
      "  </div>" +
      '  <p class="muted" style="font-size:12px;margin:14px 0 0">Admin: buka <a href="admin.html">Admin</a> + password database.</p>' +
      "</div>";
    document.body.appendChild(modal);
    if (!document.getElementById("shLoginModalStyle")) {
      var st = document.createElement("style");
      st.id = "shLoginModalStyle";
      st.textContent =
        "#shLoginModal{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px}" +
        "#shLoginModal[hidden]{display:none!important}" +
        ".sh-login-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55)}" +
        ".sh-login-panel{position:relative;z-index:1;width:min(420px,100%);background:#121a22;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px 18px;box-shadow:0 20px 50px rgba(0,0,0,.45)}" +
        ".sh-login-panel h2{margin:0 0 6px;font-size:1.25rem}" +
        ".sh-login-x{position:absolute;right:10px;top:8px;border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer}" +
        ".sh-login-panel .field{display:block;margin:0 0 10px}" +
        ".sh-login-panel .field span{display:block;font-size:12px;margin-bottom:4px;opacity:.85}";
      document.head.appendChild(st);
    }
    modal.addEventListener("click", function (e) {
      if (e.target && e.target.getAttribute("data-close") === "1") close();
    });
    document.getElementById("shLoginAngkatan").addEventListener("change", onAngkatanChange);
    document.getElementById("shLoginGo").addEventListener("click", doLogin);
    document.getElementById("shLoginPw").addEventListener("keydown", function (e) {
      if (e.key === "Enter") doLogin();
    });
    return modal;
  }

  function yearOfAlumni(a, angList) {
    if (a.angkatan_year) return String(a.angkatan_year);
    if (a.year) return String(a.year);
    var id = String(a.angkatan_id || "");
    var hit = (angList || []).find(function (x) {
      return String(x.id) === id;
    });
    if (hit) {
      if (hit.year) return String(hit.year);
      var m = String(hit.label || "").match(/20\d{2}/);
      if (m) return m[0];
    }
    return "";
  }

  async function loadDirectory() {
    if (directory) return directory;
    if (window.GalleryDB && GalleryDB.listLoginDirectory) {
      directory = await GalleryDB.listLoginDirectory();
      return directory;
    }
    var angkatan = [];
    var alumni = [];
    try {
      if (GalleryDB.listAngkatan) angkatan = (await GalleryDB.listAngkatan({})) || [];
    } catch (e) {}
    try {
      if (GalleryDB.adminListAlumni) alumni = (await GalleryDB.adminListAlumni()) || [];
    } catch (e2) {}
    directory = { ok: true, angkatan: angkatan, alumni: alumni };
    return directory;
  }

  async function fillAngkatan() {
    var sel = document.getElementById("shLoginAngkatan");
    sel.innerHTML = '<option value="">— pilih angkatan —</option>';
    var dir = await loadDirectory();
    var years = {};
    (dir.angkatan || []).forEach(function (a) {
      var y = a.year || (String(a.label || "").match(/20\d{2}/) || [])[0] || "";
      if (y) years[String(y)] = true;
    });
    (dir.alumni || []).forEach(function (a) {
      var y = yearOfAlumni(a, dir.angkatan || []);
      if (y) years[String(y)] = true;
    });
    Object.keys(years)
      .sort()
      .reverse()
      .forEach(function (y) {
        var o = document.createElement("option");
        o.value = y;
        o.textContent = "Angkatan " + y;
        sel.appendChild(o);
      });
  }

  function onAngkatanChange() {
    var year = document.getElementById("shLoginAngkatan").value;
    var sel = document.getElementById("shLoginName");
    sel.innerHTML = '<option value="">— pilih nama —</option>';
    sel.disabled = !year;
    if (!year || !directory) return;
    var list = (directory.alumni || []).filter(function (a) {
      return yearOfAlumni(a, directory.angkatan || []) === year;
    });
    list.sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""), "id");
    });
    list.forEach(function (a) {
      var o = document.createElement("option");
      o.value = a.id;
      o.textContent = (a.name || "—") + (a.class_code ? " · K" + a.class_code : "");
      o.dataset.name = a.name || "";
      o.dataset.class = a.class_code || "";
      o.dataset.role = a.role || "student";
      sel.appendChild(o);
    });
  }

  async function doLogin() {
    var err = document.getElementById("shLoginErr");
    err.hidden = true;
    var year = document.getElementById("shLoginAngkatan").value;
    var nameSel = document.getElementById("shLoginName");
    var opt = nameSel.options[nameSel.selectedIndex];
    var alumniId = nameSel.value;
    var name = (opt && opt.dataset.name) || "";
    var classCode = (opt && opt.dataset.class) || "";
    var role = (opt && opt.dataset.role) || "student";
    var password = document.getElementById("shLoginPw").value;
    if (!year || !alumniId) {
      err.textContent = "Pilih angkatan dan nama.";
      err.hidden = false;
      return;
    }
    if (!password) {
      err.textContent = "Isi password.";
      err.hidden = false;
      return;
    }
    var btn = document.getElementById("shLoginGo");
    btn.disabled = true;
    try {
      if (!window.GalleryDB || !GalleryDB.userLoginPassword) {
        throw new Error("Fitur login belum siap. Deploy ulang GAS ClassSheetsBackend.");
      }
      var sess = await GalleryDB.userLoginPassword({
        alumni_id: alumniId,
        name: name,
        angkatan_year: year,
        class_code: classCode,
        role: role,
        password: password,
      });
      close();
      if (sess && sess.must_change_password) {
        location.href = "profile.html?change_password=1";
        return;
      }
      var ret = "";
      try {
        ret = sessionStorage.getItem("sh_return") || "";
      } catch (e) {}
      location.href = ret || "index.html";
    } catch (e) {
      err.textContent = e.message || String(e);
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  }

  function open() {
    ensureModal();
    modal.hidden = false;
    fillAngkatan().catch(function (e) {
      var err = document.getElementById("shLoginErr");
      err.textContent = e.message || String(e);
      err.hidden = false;
    });
  }

  function close() {
    if (modal) modal.hidden = true;
  }

  window.SHLoginModal = { open: open, close: close };

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest && e.target.closest("#shTopLogin");
      if (!a) return;
      e.preventDefault();
      try {
        sessionStorage.setItem("sh_return", location.href);
      } catch (e2) {}
      open();
    },
    true
  );
})();
