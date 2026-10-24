(function () {
  const params = new URLSearchParams(location.search);
  const courseId = params.get("id");
  const status = document.getElementById("status");
  const userbar = document.getElementById("userbar");

  function setStatus(t) {
    if (status) status.textContent = t || "";
  }
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function main() {
    if (!courseId) {
      setStatus("Course tidak ditemukan.");
      return;
    }
    const session = await ClassDB.getSession();
    const userId = session && session.user ? session.user.id : null;
    if (userbar) userbar.textContent = session && session.user ? session.user.email : "Belum login";

    const course = await ClassDB.getCourse(courseId);
    if (!course) {
      setStatus("Course tidak ada.");
      return;
    }
    document.getElementById("courseTitle").textContent = course.title;
    document.getElementById("courseDesc").textContent = course.description || "";
    document.title = course.title + " — Silverhawk Class";

    const modules = await ClassDB.listModules(courseId);
    const progress = userId ? await ClassDB.listProgressForUser(userId) : [];
    const doneSet = {};
    progress.forEach(function (p) {
      if (p.completed) doneSet[p.material_id] = true;
    });

    let totalMat = 0;
    let doneMat = 0;
    const modHost = document.getElementById("moduleList");
    modHost.innerHTML = "";

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      if (!mod.published) continue;
      const mats = await ClassDB.listMaterials(mod.id);
      const card = document.createElement("div");
      card.className = "card";
      let html = "<h3>" + esc(mod.title) + "</h3>";
      if (mod.description) html += '<p class="muted" style="font-size:13px">' + esc(mod.description) + "</p>";
      html += '<ul class="list-mod">';
      mats.forEach(function (m) {
        if (!m.published) return;
        totalMat++;
        const done = !!doneSet[m.id];
        if (done) doneMat++;
        html += "<li>";
        html += "<strong>" + esc(m.title) + "</strong> ";
        html += '<span class="badge">' + esc(m.material_type) + "</span> ";
        if (done) html += '<span class="badge ok">Selesai</span>';
        if (m.content_url) {
          html +=
            ' <a href="' +
            esc(m.content_url) +
            '" target="_blank" rel="noopener">Buka ↗</a>';
        }
        if (m.body) html += '<div class="muted" style="font-size:13px;margin-top:4px">' + esc(m.body) + "</div>";
        if (userId && !done) {
          html +=
            ' <button type="button" class="btn btn-sm btn-primary" data-done="' +
            esc(m.id) +
            '">Tandai selesai</button>';
        }
        html += "</li>";
      });
      html += "</ul>";
      card.innerHTML = html;
      modHost.appendChild(card);
    }

    const pct = totalMat ? Math.round((doneMat / totalMat) * 100) : 0;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressLabel").textContent =
      "Progress: " + doneMat + " / " + totalMat + " materi (" + pct + "%)";

    modHost.addEventListener("click", async function (ev) {
      const btn = ev.target.closest("[data-done]");
      if (!btn) return;
      const mid = btn.getAttribute("data-done");
      try {
        const name = (session.user.email || "").split("@")[0];
        await ClassDB.markMaterialDone(mid, userId, name);
        location.reload();
      } catch (e) {
        setStatus(e.message || String(e));
      }
    });

    // Assignments
    const asgs = await ClassDB.listAssignments(courseId);
    const asgHost = document.getElementById("assignmentList");
    asgHost.innerHTML = "";
    if (!asgs.length) {
      asgHost.innerHTML = '<p class="muted">Belum ada tugas.</p>';
    }
    for (let j = 0; j < asgs.length; j++) {
      const a = asgs[j];
      const sub = userId ? await ClassDB.getMySubmission(a.id, userId) : null;
      const card = document.createElement("div");
      card.className = "card";
      let due = a.due_at ? new Date(a.due_at).toLocaleString("id-ID") : "—";
      let html =
        "<h3>" +
        esc(a.title) +
        "</h3>" +
        '<div class="meta">Deadline: ' +
        esc(due) +
        " · maks " +
        a.max_score +
        "</div>" +
        '<p class="muted" style="font-size:13px">' +
        esc(a.description || "") +
        "</p>";
      if (sub) {
        html +=
          '<span class="badge ok">Sudah dikumpul' +
          (sub.is_late ? " (telat)" : "") +
          "</span>";
        if (sub.classroom_grades && sub.classroom_grades.score != null) {
          html +=
            " <span class=\"badge\">Nilai: " +
            sub.classroom_grades.score +
            "/" +
            (sub.classroom_grades.max_score || a.max_score) +
            "</span>";
        }
      } else if (userId) {
        html +=
          '<div class="field"><label>Link pengumpulan</label><input data-link="' +
          esc(a.id) +
          '" placeholder="https://..."></div>';
        html +=
          '<div class="field"><label>Catatan</label><textarea data-body="' +
          esc(a.id) +
          '" rows="2"></textarea></div>';
        html +=
          '<button type="button" class="btn btn-primary btn-sm" data-submit="' +
          esc(a.id) +
          '" data-due="' +
          esc(a.due_at || "") +
          '">Kumpulkan</button>';
      } else {
        html += '<p class="muted">Login untuk mengumpulkan tugas.</p>';
      }
      card.innerHTML = html;
      asgHost.appendChild(card);
    }

    asgHost.addEventListener("click", async function (ev) {
      const btn = ev.target.closest("[data-submit]");
      if (!btn || !userId) return;
      const aid = btn.getAttribute("data-submit");
      const due = btn.getAttribute("data-due");
      const linkEl = asgHost.querySelector('input[data-link="' + aid + '"]');
      const bodyEl = asgHost.querySelector('textarea[data-body="' + aid + '"]');
      try {
        await ClassDB.submitAssignment({
          assignment_id: aid,
          user_id: userId,
          student_name: (session.user.email || "").split("@")[0],
          link_url: linkEl ? linkEl.value.trim() : "",
          body: bodyEl ? bodyEl.value.trim() : "",
          due_at: due || null,
        });
        setStatus("Tugas terkumpul.");
        location.reload();
      } catch (e) {
        setStatus(e.message || String(e));
      }
    });
  }

  main().catch(function (e) {
    setStatus(e.message || String(e));
  });
})();
