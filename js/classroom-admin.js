(function () {
  const status = document.getElementById("status");
  const gate = document.getElementById("adminGate");
  const userbar = document.getElementById("userbar");

  function setStatus(t) {
    if (status) status.textContent = t || "";
  }
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  async function canTeach() {
    const session = await ClassDB.getSession();
    if (!session || !session.user) return { ok: false, session: null };
    const email = session.user.email || "";
    if (ClassDB.isAdminEmail(email)) return { ok: true, session: session, email: email };
    const prof = await ClassDB.getMyProfile();
    if (prof && (prof.is_admin || prof.role === "teacher" || prof.role === "pengajar")) {
      return { ok: true, session: session, email: email, prof: prof };
    }
    return { ok: false, session: session, email: email };
  }

  async function refresh() {
    const auth = await canTeach();
    if (auth.session && auth.session.user) {
      userbar.textContent = auth.email || auth.session.user.email;
      document.getElementById("btnLogin").hidden = true;
      document.getElementById("btnLogout").hidden = false;
    } else {
      userbar.textContent = "Belum login";
      document.getElementById("btnLogin").hidden = false;
      document.getElementById("btnLogout").hidden = true;
    }
    if (!auth.ok) {
      gate.hidden = true;
      setStatus(auth.session ? "Akun ini belum punya akses pengajar/admin." : "Login dulu.");
      return;
    }
    gate.hidden = false;
    setStatus("Mode pengajar aktif.");
    await loadAdminCourses(auth);
  }

  async function loadAdminCourses(auth) {
    const host = document.getElementById("adminCourses");
    host.innerHTML = "";
    let rows = [];
    try {
      rows = await ClassDB.listCourses({ activeOnly: false });
    } catch (e) {
      setStatus("Gagal muat course: " + (e.message || e) + " — sudah jalankan SQL?");
      return;
    }
    rows.forEach(function (c) {
      const el = document.createElement("div");
      el.className = "card";
      el.innerHTML =
        "<h3>" +
        esc(c.title) +
        (c.active ? "" : ' <span class="badge warn">nonaktif</span>') +
        "</h3>" +
        '<div class="meta">' +
        esc(c.code || "") +
        "</div>" +
        '<div class="toolbar">' +
        '<button type="button" class="btn btn-sm" data-mod="' +
        c.id +
        '" data-title="' +
        esc(c.title) +
        '">Modul & materi</button>' +
        '<button type="button" class="btn btn-sm" data-asg="' +
        c.id +
        '" data-title="' +
        esc(c.title) +
        '">Tugas</button>' +
        '<a class="btn btn-sm" href="classroom-course.html?id=' +
        encodeURIComponent(c.id) +
        '">Lihat sebagai siswa</a>' +
        "</div>";
      host.appendChild(el);
    });

    host.onclick = async function (ev) {
      const modBtn = ev.target.closest("[data-mod]");
      const asgBtn = ev.target.closest("[data-asg]");
      if (modBtn) {
        openModules(modBtn.getAttribute("data-mod"), modBtn.getAttribute("data-title"));
      }
      if (asgBtn) {
        openAssignments(asgBtn.getAttribute("data-asg"), asgBtn.getAttribute("data-title"));
      }
    };
  }

  async function openModules(courseId, title) {
    document.getElementById("modulePanel").hidden = false;
    document.getElementById("matPanel").hidden = true;
    document.getElementById("modCourseId").value = courseId;
    document.getElementById("modCourseTitle").textContent = title;
    const mods = await ClassDB.listModules(courseId);
    const ul = document.getElementById("modList");
    ul.innerHTML = "";
    mods.forEach(function (m) {
      const li = document.createElement("li");
      li.innerHTML =
        "<strong>" +
        esc(m.title) +
        '</strong> <button type="button" class="btn btn-sm" data-open-mat="' +
        m.id +
        '" data-mtitle="' +
        esc(m.title) +
        '">Materi</button>';
      ul.appendChild(li);
    });
    ul.onclick = function (ev) {
      const b = ev.target.closest("[data-open-mat]");
      if (!b) return;
      openMaterials(b.getAttribute("data-open-mat"), b.getAttribute("data-mtitle"));
    };
  }

  async function openMaterials(moduleId, title) {
    document.getElementById("matPanel").hidden = false;
    document.getElementById("matModuleId").value = moduleId;
    document.getElementById("matModTitle").textContent = title;
    const mats = await ClassDB.listMaterials(moduleId);
    const ul = document.getElementById("matList");
    ul.innerHTML = "";
    mats.forEach(function (m) {
      const li = document.createElement("li");
      li.textContent = m.title + " (" + m.material_type + ")";
      ul.appendChild(li);
    });
  }

  async function openAssignments(courseId, title) {
    document.getElementById("asgPanel").hidden = false;
    document.getElementById("asgCourseId").value = courseId;
    document.getElementById("asgCourseTitle").textContent = title;
    const rows = await ClassDB.listAssignments(courseId);
    const ul = document.getElementById("asgList");
    ul.innerHTML = "";
    for (let i = 0; i < rows.length; i++) {
      const a = rows[i];
      const subs = await ClassDB.listSubmissions(a.id);
      const li = document.createElement("li");
      li.innerHTML =
        "<strong>" +
        esc(a.title) +
        "</strong> · " +
        subs.length +
        " pengumpulan" +
        '<div style="margin-top:6px">' +
        subs
          .map(function (s) {
            const g = s.classroom_grades;
            const score = g && g.score != null ? g.score : "—";
            return (
              '<div class="meta">' +
              esc(s.student_name || s.user_id || "?") +
              " → " +
              score +
              ' <input style="width:70px;display:inline-block" type="number" data-grade="' +
              s.id +
              '" placeholder="skor"> <button type="button" class="btn btn-sm" data-save-grade="' +
              s.id +
              '" data-max="' +
              (a.max_score || 100) +
              '">Nilai</button></div>'
            );
          })
          .join("") +
        "</div>";
      ul.appendChild(li);
    }
    ul.onclick = async function (ev) {
      const b = ev.target.closest("[data-save-grade]");
      if (!b) return;
      const sid = b.getAttribute("data-save-grade");
      const max = parseFloat(b.getAttribute("data-max") || "100");
      const inp = ul.querySelector('input[data-grade="' + sid + '"]');
      const score = parseFloat(inp && inp.value);
      if (isNaN(score)) {
        setStatus("Isi skor dulu");
        return;
      }
      const session = await ClassDB.getSession();
      try {
        await ClassDB.gradeSubmission(sid, score, max, "", {
          id: session.user.id,
          name: session.user.email,
        });
        setStatus("Nilai disimpan");
        openAssignments(courseId, title);
      } catch (e) {
        setStatus(e.message || String(e));
      }
    };
  }

  document.getElementById("btnLogin").onclick = function () {
    ClassDB.signInWithGoogle().catch(function (e) {
      setStatus(e.message || String(e));
    });
  };
  document.getElementById("btnLogout").onclick = function () {
    ClassDB.signOut().then(function () {
      location.reload();
    });
  };

  document.getElementById("btnSaveCourse").onclick = async function () {
    const title = document.getElementById("cTitle").value.trim();
    if (!title) return setStatus("Judul wajib");
    const session = await ClassDB.getSession();
    try {
      await ClassDB.upsertCourse({
        title: title,
        code: document.getElementById("cCode").value.trim(),
        description: document.getElementById("cDesc").value.trim(),
        teacher_user_id: session.user.id,
        teacher_name: session.user.email,
      });
      setStatus("Course disimpan");
      document.getElementById("cTitle").value = "";
      refresh();
    } catch (e) {
      setStatus(e.message || String(e));
    }
  };

  document.getElementById("btnSaveModule").onclick = async function () {
    const course_id = document.getElementById("modCourseId").value;
    const title = document.getElementById("mTitle").value.trim();
    if (!title) return;
    try {
      await ClassDB.upsertModule({ course_id: course_id, title: title });
      document.getElementById("mTitle").value = "";
      openModules(course_id, document.getElementById("modCourseTitle").textContent);
    } catch (e) {
      setStatus(e.message || String(e));
    }
  };

  document.getElementById("btnSaveMat").onclick = async function () {
    const module_id = document.getElementById("matModuleId").value;
    const title = document.getElementById("matTitle").value.trim();
    if (!title) return;
    try {
      await ClassDB.upsertMaterial({
        module_id: module_id,
        title: title,
        material_type: document.getElementById("matType").value,
        content_url: document.getElementById("matUrl").value.trim(),
        body: document.getElementById("matBody").value.trim(),
      });
      document.getElementById("matTitle").value = "";
      openMaterials(module_id, document.getElementById("matModTitle").textContent);
    } catch (e) {
      setStatus(e.message || String(e));
    }
  };

  document.getElementById("btnSaveAsg").onclick = async function () {
    const course_id = document.getElementById("asgCourseId").value;
    const title = document.getElementById("aTitle").value.trim();
    if (!title) return;
    let due = document.getElementById("aDue").value;
    let due_at = due ? new Date(due).toISOString() : null;
    try {
      await ClassDB.upsertAssignment({
        course_id: course_id,
        title: title,
        description: document.getElementById("aDesc").value.trim(),
        due_at: due_at,
        max_score: parseFloat(document.getElementById("aMax").value) || 100,
      });
      document.getElementById("aTitle").value = "";
      openAssignments(course_id, document.getElementById("asgCourseTitle").textContent);
    } catch (e) {
      setStatus(e.message || String(e));
    }
  };

  refresh();
})();
