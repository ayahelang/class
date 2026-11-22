/**
 * GalleryDB adapter — Google Apps Script + Spreadsheet (mode primer Class)
 * Chat: polling, bukan realtime.
 */
(function (global) {
  "use strict";
  var LS_MODE = "sh_class_db_mode_v1";
  var LS_SESSION = "sh_class_sheets_session_v1";

  // Migrasi: jangan pakai localStorage untuk sesi
  try {
    if (localStorage.getItem(LS_SESSION)) {
      localStorage.removeItem(LS_SESSION);
    }
  } catch (eMig) {}


  function cfg() {
    return global.SH_DB_BACKEND_CONFIG || {};
  }

  function getMode() {
    try {
      var m = sessionStorage.getItem(LS_MODE);
      if (m === "sheets" || m === "supabase" || m === "firebase") return m;
    } catch (e) {}
    return cfg().primary || "sheets";
  }

  function setMode(m) {
    try {
      sessionStorage.setItem(LS_MODE, m);
    } catch (e) {}
    try {
      cfg().primary = m;
    } catch (e2) {}
  }

  function supabaseAllowed() {
    try {
      var v = sessionStorage.getItem("sh_class_allow_supabase");
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {}
    return !!cfg().allowSupabase;
  }

  function setSupabaseAllowed(on) {
    try {
      sessionStorage.setItem("sh_class_allow_supabase", on ? "1" : "0");
    } catch (e) {}
    cfg().allowSupabase = !!on;
  }

  function firebaseAllowed() {
    try {
      var v = sessionStorage.getItem("sh_class_allow_firebase");
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {}
    return !!cfg().allowFirebase;
  }

  function setFirebaseAllowed(on) {
    try {
      sessionStorage.setItem("sh_class_allow_firebase", on ? "1" : "0");
    } catch (e) {}
    cfg().allowFirebase = !!on;
  }

  function gasUrl() {
    return String((cfg().gasUrl || "").trim());
  }

  function sheetsReady() {
    return !!gasUrl();
  }

  async function gasCall(action, payload) {
    var url = gasUrl();
    if (!url) throw new Error("URL database belum dikonfigurasi.");
    var body = Object.assign(
      {
        action: action,
        site: cfg().siteId || "class",
        token: (readSession() && readSession().token) || "",
      },
      payload || {}
    );
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    var text = await res.text();
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("GAS response invalid: " + String(text).slice(0, 140));
    }
    if (!data || data.ok === false) {
      throw new Error((data && data.error) || "GAS error");
    }
    return data;
  }

  function readSession() {
    try {
      var o = JSON.parse(sessionStorage.getItem(LS_SESSION) || "null");
      if (!o || !o.exp || Date.now() > o.exp) {
        sessionStorage.removeItem(LS_SESSION);
        return null;
      }
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeSession(o) {
    var hours = Number(cfg().sessionHours) || 8;
    o = o || {};
    var s = {
      ok: true,
      role: o.role || "admin",
      name: o.name || "Admin",
      email: o.email || "admin-sheets@local",
      token: o.token || ("t-" + Date.now()),
      exp: Date.now() + hours * 3600 * 1000,
      user_id: o.user_id || "",
      alumni_id: o.alumni_id || "",
      angkatan_year: o.angkatan_year || "",
      class_code: o.class_code || "",
      must_change_password: !!o.must_change_password,
    };
    sessionStorage.setItem(LS_SESSION, JSON.stringify(s));
    return s;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(LS_SESSION);
    } catch (e) {}
  }

  /** API mirip GalleryDB untuk mode sheets */
  var SheetsDB = {
    enabled: function () {
      return sheetsReady();
    },
    getBackendMode: getMode,
    setBackendMode: setMode,
    supabaseAllowed: supabaseAllowed,
    setSupabaseAllowed: setSupabaseAllowed,
    firebaseAllowed: firebaseAllowed,
    setFirebaseAllowed: setFirebaseAllowed,
    gasCall: gasCall,
    clearSession: clearSession,

    getSession: async function () {
      var s = readSession();
      if (!s) return null;
      return {
        user: {
          id: s.user_id || ("sheets-" + (s.email || "admin")),
          email: s.email,
          user_metadata: {
            full_name: s.name,
            name: s.name,
            role: s.role || "student",
            must_change_password: !!s.must_change_password,
            alumni_id: s.alumni_id || "",
            angkatan_year: s.angkatan_year || "",
            class_code: s.class_code || "",
          },
        },
      };
    },

    signInWithGoogle: async function () {
      if (!supabaseAllowed() && getMode() !== "supabase") {
        throw new Error("Login Google belum diaktifkan oleh admin.");
      }
      throw new Error("Login Google belum diaktifkan.");
    },

    signOut: async function () {
      clearSession();
    },

    /** Login admin password via GAS Script Properties */
    adminLoginPassword: async function (password) {
      var data = await gasCall("adminLogin", { password: String(password || "") });
      return writeSession({
        role: "admin",
        name: data.label || "Admin",
        email: data.email || "admin-sheets@local",
        token: data.token || ("t-" + Date.now()),
      });
    },

    requireAdmin: async function () {
      var s = readSession();
      if (s && s.role === "admin") {
        return {
          ok: true,
          email: s.email,
          session: await SheetsDB.getSession(),
          main: true,
          via: "sheets",
        };
      }
      return { ok: false, reason: "not_logged_in" };
    },

    isCurrentUserAdmin: async function () {
      var s = readSession();
      return !!(s && s.role === "admin");
    },

    getMyProfile: async function () {
      var s = readSession();
      if (!s) return null;
      return {
        id: "sheets-" + s.email,
        email: s.email,
        display_name: s.name,
        is_admin: s.role === "admin",
      };
    },

    upsertMyProfileFromSession: async function () {
      return SheetsDB.getMyProfile();
    },

    // ---- generic table helpers ----
    listRows: async function (table, opts) {
      var payload = {
        table: table,
        limit: (opts && opts.limit) || 500,
      };
      // chat: minta baris terbaru dari GAS
      if (table === "chat_messages") payload.newest = true;
      var data = await gasCall("list", payload);
      var rows = (data && data.rows) || [];
      return rows.map(function (obj) {
        if (!obj || typeof obj !== "object") return obj;
        if (obj.row_json && typeof obj.row_json === "object") {
          var inner = obj.row_json;
          if (!inner.id) inner.id = obj.id;
          obj = inner;
        }
        return obj;
      });
    },

    upsertRow: async function (table, row) {
      var data = await gasCall("upsert", { table: table, row: row || {} });
      return data.row || row;
    },

    deleteRow: async function (table, id) {
      var rid = id;
      if (id && typeof id === "object") rid = id.id || id;
      rid = rid != null ? String(rid) : "";
      if (!rid) throw new Error("deleteRow: id kosong");
      await gasCall("delete", { table: table, id: rid });
      return true;
    },

    // ---- domain mappings ----
    listAnnouncementsAdmin: async function () {
      return SheetsDB.listRows("announcements", { limit: 200 });
    },
    listAnnouncementsPublic: async function () {
      var rows = await SheetsDB.listRows("announcements", { limit: 100 });
      return (rows || []).filter(function (r) {
        return r.active !== false && r.active !== "false";
      });
    },
    upsertAnnouncement: async function (payload) {
      return SheetsDB.upsertRow("announcements", payload);
    },
    deleteAnnouncement: async function (id) {
      return SheetsDB.deleteRow("announcements", id);
    },

    listAttendanceSessionsAdmin: async function () {
      return SheetsDB.listRows("attendance_sessions", { limit: 300 });
    },
    upsertAttendanceSession: async function (payload) {
      return SheetsDB.upsertRow("attendance_sessions", payload);
    },
    deleteAttendanceSession: async function (id) {
      return SheetsDB.deleteRow("attendance_sessions", id);
    },
    listAttendanceRecords: async function (filters) {
      var rows = await SheetsDB.listRows("attendance_records", { limit: 1000 });
      if (filters && filters.session_id) {
        rows = rows.filter(function (r) {
          return String(r.session_id) === String(filters.session_id);
        });
      }
      return rows;
    },
    upsertAttendanceRecord: async function (payload) {
      return SheetsDB.upsertRow("attendance_records", payload);
    },

    listChatRooms: async function () {
      var rows = await SheetsDB.listRows("chat_rooms", { limit: 100 });
      return (rows || []).map(function (r) {
        r.needs_password = !!(r.access_password && String(r.access_password).trim());
        return r;
      });
    },
    upsertChatRoom: async function (payload) {
      return SheetsDB.upsertRow("chat_rooms", payload);
    },
    deleteChatRoom: async function (id) {
      return SheetsDB.deleteRow("chat_rooms", id);
    },
    listChatMessages: async function (roomId, limit, angkatanId) {
      // Ambil lebih banyak lalu filter — GAS list chat_messages pakai newest-first
      var rows = await SheetsDB.listRows("chat_messages", { limit: Math.max(limit || 200, 500) });
      rows = rows || [];
      var rid = roomId != null && roomId !== "" ? String(roomId) : "";
      var aid = angkatanId != null && angkatanId !== "" ? String(angkatanId) : "";
      if (rid) {
        rows = rows.filter(function (r) {
          return String(r.room_id || "") === rid;
        });
      } else if (aid) {
        rows = rows.filter(function (r) {
          // ruang angkatan: cocok angkatan_id dan tanpa room_id custom
          return String(r.angkatan_id || "") === aid && !r.room_id;
        });
      }
      rows.sort(function (a, b) {
        var ta = Date.parse(a.created_at || "") || 0;
        var tb = Date.parse(b.created_at || "") || 0;
        return ta - tb;
      });
      if (limit && rows.length > limit) {
        rows = rows.slice(rows.length - limit);
      }
      return rows;
    },
    insertChatMessage: async function (payload) {
      payload = payload || {};
      payload.created_at = payload.created_at || new Date().toISOString();
      payload.updated_at = payload.updated_at || payload.created_at;
      if (!payload.id) payload.id = "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      // normalisasi id ruang / angkatan sebagai string (hindari null vs "null")
      if (payload.room_id == null || payload.room_id === "" || payload.room_id === "null") {
        payload.room_id = "";
      } else {
        payload.room_id = String(payload.room_id);
      }
      if (payload.angkatan_id == null || payload.angkatan_id === "" || payload.angkatan_id === "null") {
        payload.angkatan_id = "";
      } else {
        payload.angkatan_id = String(payload.angkatan_id);
      }
      var saved = await SheetsDB.upsertRow("chat_messages", payload);
      // pastikan bentuk return selalu punya id + body untuk addMsg di chat.js
      if (!saved || typeof saved !== "object") saved = payload;
      if (!saved.id) saved.id = payload.id;
      if (saved.body == null) saved.body = payload.body || "";
      if (!saved.author_name) saved.author_name = payload.author_name || "Anonim";
      if (!saved.created_at) saved.created_at = payload.created_at;
      return saved;
    },

    /** Alias yang dipakai chat.js lewat router */
    listChat: async function (opts) {
      opts = opts || {};
      return SheetsDB.listChatMessages(opts.roomId || opts.room_id || null, opts.limit || 200, opts.angkatanId || opts.angkatan_id || null);
    },
    sendChat: async function (opts) {
      opts = opts || {};
      var row = {
        room_id: opts.roomId || opts.room_id || "",
        angkatan_id: opts.angkatanId || opts.angkatan_id || "",
        author_name: opts.authorName || opts.author_name || "Anonim",
        body: opts.body || "",
        avatar_emoji: opts.avatarEmoji || opts.avatar_emoji || "💬",
        reply_to: opts.replyTo || opts.reply_to || null,
        user_id: opts.userId || opts.user_id || null,
        is_registered: !!opts.is_registered,
        created_at: new Date().toISOString(),
      };
      try {
        var sess = await SheetsDB.getSession();
        if (sess && sess.user) {
          row.user_id = row.user_id || sess.user.id || null;
          if (sess.user.email) row.author_email = sess.user.email;
        }
      } catch (eS) {}
      return SheetsDB.insertChatMessage(row);
    },
    clearChatMessages: async function (roomId) {
      await gasCall("clearChat", { room_id: roomId });
      return true;
    },
    deleteChat: async function (arg) {
      var id = arg && typeof arg === "object" ? arg.id : arg;
      return SheetsDB.deleteRow("chat_messages", id);
    },
    verifyChatRoomAccess: async function (opts) {
      opts = opts || {};
      var rooms = await SheetsDB.listChatRooms();
      var r = (rooms || []).find(function (x) {
        return String(x.id) === String(opts.roomId);
      });
      if (!r) return false;
      var pw = r.access_password || "";
      if (pw && String(pw).trim()) {
        if (String(pw).trim() !== String(opts.password || "").trim()) return false;
      }
      return true;
    },

    adminListAlumni: async function () {
      var angkatan = [];
      try {
        angkatan = (await SheetsDB.listRows("angkatan", { limit: 200 })) || [];
      } catch (eA) {}
      var byId = {};
      (angkatan || []).forEach(function (a) {
        if (a && a.id) byId[String(a.id)] = a;
      });
      var rows = (await SheetsDB.listRows("alumni", { limit: 5000 })) || [];
      return rows.map(function (al) {
        var ang = byId[String(al.angkatan_id || "")] || {};
        var label = ang.label || al.angkatan_label || "";
        if (!label && (al.angkatan_year || al.year)) label = "Angkatan " + (al.angkatan_year || al.year);
        return Object.assign({}, al, {
          gallery_angkatan: { id: ang.id || al.angkatan_id || null, label: label, label_norm: ang.label_norm || "" },
        });
      });
    },
    listAngkatan: async function () {
      return SheetsDB.listRows("angkatan", { limit: 200 });
    },
    adminListAngkatanAll: async function () {
      return SheetsDB.listRows("angkatan", { limit: 200 });
    },
    adminUpsertAngkatan: async function (opts) {
      opts = opts || {};
      var label = String(opts.label || "").trim();
      if (!label) throw new Error("Label angkatan wajib");
      var ln = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      var row = {
        id: opts.id || "ang-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        label: label,
        label_norm: ln,
        source: opts.source || "admin",
      };
      if (opts.id) row.id = opts.id;
      return SheetsDB.upsertRow("angkatan", row);
    },
    adminDeleteAngkatan: async function (id) {
      return SheetsDB.deleteRow("angkatan", id);
    },
    adminUpsertAlumni: async function (opts) {
      opts = opts || {};
      var nm = String(opts.name || "").trim();
      if (nm.length < 2) throw new Error("Nama terlalu pendek");
      var row = {
        id: opts.id || "al-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        name: nm,
        name_norm: nm.toLowerCase().replace(/\s+/g, " "),
        class_code: String(opts.classCode || opts.class_code || "").trim() || null,
        angkatan_id: opts.angkatanId || opts.angkatan_id || null,
        role: String(opts.role || "Santriwati").trim() || "Santriwati",
      };
      if (opts.id) row.id = opts.id;
      return SheetsDB.upsertRow("alumni", row);
    },
    adminDeleteAlumni: async function (id) {
      return SheetsDB.deleteRow("alumni", id);
    },
    adminListWebsites: async function () {
      var alumni = [];
      var angkatan = [];
      try {
        alumni = (await SheetsDB.listRows("alumni", { limit: 5000 })) || [];
      } catch (e1) {}
      try {
        angkatan = (await SheetsDB.listRows("angkatan", { limit: 200 })) || [];
      } catch (e2) {}
      var angById = {};
      (angkatan || []).forEach(function (a) {
        if (a && a.id) angById[String(a.id)] = a;
      });
      var alById = {};
      (alumni || []).forEach(function (al) {
        if (!al || !al.id) return;
        var ang = angById[String(al.angkatan_id || "")] || {};
        alById[String(al.id)] = Object.assign({}, al, {
          gallery_angkatan: {
            id: ang.id || al.angkatan_id || null,
            label: ang.label || (al.angkatan_year ? "Angkatan " + al.angkatan_year : "") || "",
          },
        });
      });
      var rows = (await SheetsDB.listRows("websites", { limit: 5000 })) || [];
      return rows.map(function (w) {
        var al = alById[String(w.alumni_id || w.owner_alumni_id || "")] || null;
        return Object.assign({}, w, {
          gallery_alumni: al
            ? {
                id: al.id,
                name: al.name,
                class_code: al.class_code,
                angkatan_id: al.angkatan_id,
                gallery_angkatan: al.gallery_angkatan || {},
              }
            : null,
        });
      });
    },
    adminUpsertWebsite: async function (opts) {
      opts = opts || {};
      var t = String(opts.title || "").trim() || "Website";
      var u = String(opts.url || "").trim();
      if (!/^https?:\/\//i.test(u)) throw new Error("URL harus http(s)");
      var alumniId = opts.alumniId || opts.alumni_id || null;
      if (!opts.id && !alumniId) throw new Error("Pilih alumni pemilik website");
      var row = {
        id: opts.id || "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        title: t,
        url: u,
        category: String(opts.category || "Web Kreatif").trim() || "Web Kreatif",
        alumni_id: alumniId,
      };
      if (opts.id) row.id = opts.id;
      return SheetsDB.upsertRow("websites", row);
    },
    adminDeleteWebsite: async function (id) {
      return SheetsDB.deleteRow("websites", id);
    },
    listVideosAdmin: async function () {
      return SheetsDB.listRows("videos", { limit: 500 });
    },
    listVideos: async function () {
      return SheetsDB.listRows("videos", { limit: 2000 });
    },
    listDesigns: async function () {
      return SheetsDB.listRows("designs", { limit: 2000 });
    },
    listDesignsPublic: async function () {
      var rows = await SheetsDB.listRows("designs", { limit: 2000 });
      return (rows || []).filter(function (r) {
        return r.active !== false && r.active !== "false";
      });
    },
    adminListDesigns: async function () {
      return SheetsDB.listRows("designs", { limit: 2000 });
    },
    upsertDesign: async function (payload) {
      payload = payload || {};
      if (!payload.id) payload.id = "dg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      payload.updated_at = new Date().toISOString();
      if (!payload.created_at) payload.created_at = payload.updated_at;
      return SheetsDB.upsertRow("designs", payload);
    },
    deleteDesign: async function (id) {
      return SheetsDB.deleteRow("designs", id);
    },

    /** Profil + users login password (Sheet) digabung agar Roles menampilkan semua akun */
    listRegisteredUsers: async function () {
      var profiles = [];
      var users = [];
      try {
        profiles = (await SheetsDB.listRows("profiles", { limit: 5000 })) || [];
      } catch (e) {}
      try {
        users = (await SheetsDB.listRows("users", { limit: 5000 })) || [];
      } catch (e2) {}
      var byId = {};
      (profiles || []).forEach(function (p) {
        if (!p || p.id == null) return;
        byId[String(p.id)] = Object.assign({}, p);
      });
      (users || []).forEach(function (u) {
        if (!u || u.id == null) return;
        var id = String(u.id);
        var prev = byId[id] || {};
        byId[id] = Object.assign({}, prev, u, {
          id: id,
          display_name: u.display_name || u.name || prev.display_name || prev.name || "",
          email: u.email || prev.email || "",
          linked_student_name: prev.linked_student_name || u.linked_student_name || u.name || "",
          linked_angkatan_year: prev.linked_angkatan_year || u.angkatan_year || null,
          linked_class_code: prev.linked_class_code || u.class_code || "",
          linked_alumni_id: prev.linked_alumni_id || u.alumni_id || null,
          alumni_id: u.alumni_id || prev.alumni_id || prev.linked_alumni_id || null,
          role: u.role || prev.role || "student",
          must_change_password: u.must_change_password != null ? u.must_change_password : prev.must_change_password,
          is_admin: prev.is_admin || u.role === "admin",
        });
      });
      return Object.keys(byId).map(function (k) {
        return byId[k];
      });
    },
    adminListLinks: async function () {
      var rows = await SheetsDB.listRegisteredUsers();
      return (rows || []).filter(function (r) {
        return !!(r.linked_student_name && String(r.linked_student_name).trim());
      });
    },
    adminForceLinkProfile: async function (userId, opts) {
      opts = opts || {};
      var name = String(opts.studentName || opts.linked_student_name || "").trim();
      var year = parseInt(opts.angkatanYear || opts.linked_angkatan_year, 10) || null;
      var kelas = String(opts.classCode || opts.linked_class_code || "").trim();
      if (!userId || !name || !year) throw new Error("Lengkapi user, nama, dan angkatan.");
      var all = await SheetsDB.listRegisteredUsers();
      var target = (all || []).find(function (p) {
        return String(p.id) === String(userId);
      });
      if (!target) {
        target = { id: userId };
      }
      var norm = function (s) {
        return String(s || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      };
      for (var i = 0; i < (all || []).length; i++) {
        var o = all[i];
        if (String(o.id) === String(userId)) continue;
        if (String(o.linked_angkatan_year) === String(year) && norm(o.linked_student_name) === norm(name)) {
          await SheetsDB.upsertRow("profiles", Object.assign({}, o, {
            linked_student_name: "",
            linked_angkatan_year: null,
            linked_class_code: "",
            linked_alumni_id: null,
            updated_at: new Date().toISOString(),
          }));
        }
      }
      var row = Object.assign({}, target, {
        id: userId,
        linked_student_name: name,
        linked_angkatan_year: year,
        linked_class_code: kelas,
        updated_at: new Date().toISOString(),
      });
      return SheetsDB.upsertRow("profiles", row);
    },
    adminUnlinkProfile: async function (userId) {
      var all = await SheetsDB.listRegisteredUsers();
      var target = (all || []).find(function (p) {
        return String(p.id) === String(userId);
      });
      if (!target) throw new Error("User tidak ditemukan");
      var row = Object.assign({}, target, {
        linked_student_name: "",
        linked_angkatan_year: null,
        linked_class_code: "",
        linked_alumni_id: null,
        link_allow_user_ids: [],
        updated_at: new Date().toISOString(),
      });
      return SheetsDB.upsertRow("profiles", row);
    },
    setUserAdmin: async function (userId, opts) {
      opts = opts || {};
      var all = await SheetsDB.listRegisteredUsers();
      var target = (all || []).find(function (p) {
        return String(p.id) === String(userId);
      });
      if (!target) throw new Error("User tidak ditemukan");
      var row = Object.assign({}, target, {
        is_admin: !!opts.isAdmin,
        permissions: opts.permissions || {},
        role: opts.role !== undefined ? opts.role || "" : target.role || "",
        updated_at: new Date().toISOString(),
      });
      return SheetsDB.upsertRow("profiles", row);
    },
    adminDeleteUserProfile: async function (userId) {
      var all = await SheetsDB.listRegisteredUsers();
      var target = (all || []).find(function (p) {
        return String(p.id) === String(userId);
      });
      if (!target) throw new Error("User tidak ditemukan");
      if (target.is_admin === true || target.is_admin === "true") throw new Error("Tidak dapat menghapus user admin");
      return SheetsDB.deleteRow("profiles", userId);
    },
    deleteUserProfiles: async function (ids) {
      ids = ids || [];
      for (var i = 0; i < ids.length; i++) {
        try {
          await SheetsDB.adminDeleteUserProfile(ids[i]);
        } catch (e) {}
      }
      return true;
    },

    /** Bangun struktur gallery dari tab Sheet (alumni + websites) */
    fetchGalleryFromDb: async function () {
      var alumni = [];
      var websites = [];
      var angkatan = [];
      try {
        alumni = (await SheetsDB.listRows("alumni", { limit: 5000 })) || [];
      } catch (e1) {}
      try {
        websites = (await SheetsDB.listRows("websites", { limit: 5000 })) || [];
      } catch (e2) {}
      try {
        angkatan = (await SheetsDB.listRows("angkatan", { limit: 200 })) || [];
      } catch (e3) {}

      var angById = {};
      (angkatan || []).forEach(function (a) {
        if (a && a.id) angById[String(a.id)] = a;
      });

      var worksByAlumni = {};
      (websites || []).forEach(function (w) {
        var aid = String(w.alumni_id || w.owner_alumni_id || "");
        if (!aid) return;
        if (!worksByAlumni[aid]) worksByAlumni[aid] = [];
        worksByAlumni[aid].push({
          id: w.id,
          title: w.title || w.name || "Karya",
          url: w.url || w.link || "",
          category: w.category || "Lainnya",
        });
      });

      var students = (alumni || []).map(function (al) {
        var ang = angById[String(al.angkatan_id || "")] || {};
        var year =
          al.angkatan_year ||
          al.year ||
          ang.year ||
          (String(ang.label || "").match(/20\d{2}/) || [])[0] ||
          "";
        return {
          id: al.id,
          name: al.name || al.display_name || "",
          class: al.class_code || al.class || "",
          angkatan: String(year || ""),
          year: String(year || ""),
          role: al.role || "student",
          works: worksByAlumni[String(al.id)] || [],
        };
      });

      return {
        meta: { source: "sheets", updated_at: new Date().toISOString() },
        students: students,
      };
    },


    listVideoCategories: async function () {
      var cats = [];
      try {
        cats = (await SheetsDB.listRows("video_categories", { limit: 200 })) || [];
      } catch (e) {}
      if (cats.length) return cats;
      // turunkan dari videos
      var vids = [];
      try {
        vids = (await SheetsDB.listRows("videos", { limit: 2000 })) || [];
      } catch (e2) {}
      var map = {};
      (vids || []).forEach(function (v) {
        var c = v.category || v.category_name || "Umum";
        var id = v.category_id || String(c).toLowerCase().replace(/\s+/g, "-");
        if (!map[id]) map[id] = { id: id, name: c, label: c };
      });
      return Object.keys(map).map(function (k) { return map[k]; });
    },

    getStatsSummary: async function () {
      var alumni = [], websites = [], videos = [], designs = [], events = [];
      try { alumni = (await SheetsDB.listRows("alumni", { limit: 5000 })) || []; } catch (e) {}
      try { websites = (await SheetsDB.listRows("websites", { limit: 5000 })) || []; } catch (e) {}
      try { videos = (await SheetsDB.listRows("videos", { limit: 5000 })) || []; } catch (e) {}
      try { designs = (await SheetsDB.listRows("designs", { limit: 5000 })) || []; } catch (e) {}
      try { events = (await SheetsDB.listRows("events", { limit: 5000 })) || []; } catch (e) {}
      var love = 0, comments = 0, visits = 0;
      try {
        var reacts = (await SheetsDB.listRows("reactions", { limit: 5000 })) || [];
        reacts.forEach(function (r) {
          if (r.reaction_type === "love") love++;
          if (r.reaction_type === "comment") comments++;
        });
      } catch (eR) {}
      (events || []).forEach(function (ev) {
        if (String(ev.event_type || "") === "visit") visits++;
      });
      return {
        students: alumni.length,
        websites: websites.length,
        videos: videos.length,
        designs: designs.length,
        loves: love,
        comments: comments,
        visits: visits,
        online: 0,
      };
    },

    getStatsTimeseries: async function (days) {
      days = days || 14;
      var events = [];
      try { events = (await SheetsDB.listRows("events", { limit: 5000 })) || []; } catch (e) {}
      var buckets = {};
      var now = new Date();
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(now.getTime() - i * 86400000);
        var key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      (events || []).forEach(function (ev) {
        var t = String(ev.created_at || "").slice(0, 10);
        if (buckets[t] != null) buckets[t]++;
      });
      return Object.keys(buckets).sort().map(function (k) {
        return { date: k, count: buckets[k] };
      });
    },

    trackEvent: async function (type, meta) {
      try {
        await SheetsDB.upsertRow("events", {
          id: "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          event_type: type || "visit",
          meta: meta || {},
          created_at: new Date().toISOString(),
        });
      } catch (e) {}
      return true;
    },

    joinPresenceOnline: async function (cb) {
      if (typeof cb === "function") {
        try { cb(1); } catch (e) {}
      }
      return { unsubscribe: function () {} };
    },

    listLoginDirectory: async function () {
      // Prefer aksi khusus; jika GAS belum di-deploy ulang, fallback list tab
      try {
        var data = await gasCall("listLoginDirectory", {});
        if (data && data.ok) return data;
      } catch (e) {
        console.warn("listLoginDirectory GAS", e);
      }
      var angkatan = [];
      var alumni = [];
      try { angkatan = (await SheetsDB.listRows("angkatan", { limit: 200 })) || []; } catch (e1) {}
      try { alumni = (await SheetsDB.listRows("alumni", { limit: 5000 })) || []; } catch (e2) {}
      return { ok: true, angkatan: angkatan, alumni: alumni };
    },

    userLoginPassword: async function (opts) {
      opts = opts || {};
      var data = await gasCall("userLogin", {
        name: opts.name || "",
        alumni_id: opts.alumni_id || "",
        angkatan_year: opts.angkatan_year || "",
        class_code: opts.class_code || "",
        role: opts.role || "student",
        password: opts.password || "",
      });
      if (!data || !data.ok) throw new Error((data && data.error) || "Login gagal");
      var u = data.user || {};
      var sess = writeSession({
        token: data.token,
        email: u.email || ((u.name || "user") + "@sheets.local"),
        name: u.name || "User",
        role: u.role || "student",
      });
      // field tambahan untuk profil / absensi
      try {
        var full = JSON.parse(sessionStorage.getItem(LS_SESSION) || "{}");
        full.user_id = u.id;
        full.alumni_id = u.alumni_id || "";
        full.angkatan_year = u.angkatan_year || "";
        full.class_code = u.class_code || "";
        full.must_change_password = !!u.must_change_password;
        full.token = data.token;
        sessionStorage.setItem(LS_SESSION, JSON.stringify(full));
        sess = full;
      } catch (e) {}
      return sess;
    },

    userChangePassword: async function (opts) {
      opts = opts || {};
      var s = readSession() || {};
      var data = await gasCall("userChangePassword", {
        token: s.token || "",
        user_id: s.user_id || "",
        old_password: opts.old_password || "",
        new_password: opts.new_password || "",
      });
      if (!data || !data.ok) throw new Error((data && data.error) || "Gagal ganti password");
      try {
        s.must_change_password = false;
        sessionStorage.setItem(LS_SESSION, JSON.stringify(s));
      } catch (e2) {}
      return true;
    },

    adminResetUserPassword: async function (opts) {
      opts = opts || {};
      var data = await gasCall("adminResetUserPassword", {
        password: opts.admin_password || opts.password || "",
        user_id: opts.user_id || "",
        alumni_id: opts.alumni_id || "",
        display_name: opts.display_name || opts.name || "",
        angkatan_year: opts.angkatan_year || "",
        class_code: opts.class_code || "",
        role: opts.role || "student",
        new_password: opts.new_password || "Bismillaah",
      });
      if (!data || !data.ok) throw new Error((data && data.error) || "Reset gagal");
      return data;
    },

    isCurrentUserAdmin: async function () {
      var s = readSession();
      if (!s) return false;
      return s.role === "admin" || String(s.email || "").indexOf("admin") === 0;
    },

    getMyProfile: async function () {
      var s = readSession();
      if (!s) return null;
      return {
        id: s.user_id || "sheets-user",
        display_name: s.name,
        linked_student_name: s.name,
        linked_angkatan_year: s.angkatan_year || null,
        linked_class_code: s.class_code || "",
        linked_alumni_id: s.alumni_id || null,
        must_change_password: !!s.must_change_password,
        role: s.role || "student",
      };
    },

    /** Siswa: daftar sesi absensi aktif (mode Sheets) */
    listActiveAttendanceSessions: async function () {
      var rows = await SheetsDB.listRows("attendance_sessions", { limit: 300 });
      return (rows || []).filter(function (r) {
        return r.active === true || r.active === "true" || r.active === 1 || r.active === "1";
      });
    },

    /** Siswa: rekap absensi milik user login */
    myAttendanceRecords: async function () {
      var s = readSession();
      if (!s) return [];
      var uid = String(s.user_id || "");
      var name = String(s.name || "").toLowerCase().trim();
      var rows = await SheetsDB.listRows("attendance_records", { limit: 1000 });
      return (rows || []).filter(function (r) {
        if (uid && String(r.user_id || "") === uid) return true;
        if (name && String(r.student_name || "").toLowerCase().trim() === name) return true;
        return false;
      });
    },

    /** Siswa: check-in ke sesi */
    submitAttendanceCheckin: async function (opts) {
      opts = opts || {};
      var sessionId = opts.sessionId || opts.session_id;
      var note = opts.note || "";
      var s = readSession();
      if (!s) throw new Error("Login dulu");
      var prof = await SheetsDB.getMyProfile();
      if (!prof || !prof.linked_student_name) throw new Error("Tautkan nama siswa di Profil dulu");

      var sessions = await SheetsDB.listRows("attendance_sessions", { limit: 300 });
      var sess = (sessions || []).find(function (x) {
        return String(x.id) === String(sessionId);
      });
      if (!sess) throw new Error("Sesi absensi tidak ditemukan");
      if (!(sess.active === true || sess.active === "true" || sess.active === 1 || sess.active === "1")) {
        throw new Error("Sesi absensi tidak aktif");
      }

      function jakartaMinutes() {
        var fmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        var parts = Object.fromEntries(
          fmt.formatToParts(new Date()).map(function (p) {
            return [p.type, p.value];
          })
        );
        return parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      }
      function toMin(t) {
        var p = String(t || "0:0").slice(0, 5).split(":");
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10);
      }

      var mins = jakartaMinutes();
      var ci0 = toMin(sess.checkin_start);
      var ci1 = toMin(sess.checkin_end);
      var checkin_status = "on_time";
      if (mins > ci1) {
        if (sess.allow_late === true || sess.allow_late === "true" || sess.allow_late === 1 || sess.allow_late === "1") {
          checkin_status = "late";
        } else {
          throw new Error("Waktu check-in sudah ditutup. Admin tidak mengizinkan absen terlambat.");
        }
      } else if (mins < ci0) {
        throw new Error("Belum masuk waktu check-in.");
      }

      var uid = String(s.user_id || ("sheets-" + (s.email || "user")));
      var allRec = await SheetsDB.listRows("attendance_records", { limit: 1000 });
      var existing = (allRec || []).find(function (r) {
        return String(r.session_id) === String(sessionId) && String(r.user_id || "") === uid;
      });
      if (!existing) {
        existing = (allRec || []).find(function (r) {
          return (
            String(r.session_id) === String(sessionId) &&
            String(r.student_name || "").toLowerCase().trim() ===
              String(prof.linked_student_name).toLowerCase().trim()
          );
        });
      }
      if (existing && existing.checkin_at) throw new Error("Sudah check-in untuk sesi ini");

      var now = new Date().toISOString();
      var row = {
        id: existing && existing.id ? existing.id : "ar-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        session_id: sessionId,
        user_id: uid,
        student_name: prof.linked_student_name,
        angkatan_year: String(prof.linked_angkatan_year || s.angkatan_year || ""),
        class_code: String(prof.linked_class_code || s.class_code || ""),
        email: s.email || "",
        checkin_at: now,
        checkin_note: String(note || "").slice(0, 120),
        checkin_status: checkin_status,
        updated_at: now,
      };
      if (existing) {
        row.checkout_at = existing.checkout_at || null;
        row.checkout_note = existing.checkout_note || "";
        row.checkout_status = existing.checkout_status || "";
      }
      return SheetsDB.upsertRow("attendance_records", row);
    },

    /** Siswa: check-out dari sesi */
    submitAttendanceCheckout: async function (opts) {
      opts = opts || {};
      var sessionId = opts.sessionId || opts.session_id;
      var note = opts.note || "";
      var s = readSession();
      if (!s) throw new Error("Login dulu");
      var uid = String(s.user_id || ("sheets-" + (s.email || "user")));
      var name = String(s.name || "").toLowerCase().trim();

      var allRec = await SheetsDB.listRows("attendance_records", { limit: 1000 });
      var existing = (allRec || []).find(function (r) {
        return String(r.session_id) === String(sessionId) && String(r.user_id || "") === uid;
      });
      if (!existing && name) {
        existing = (allRec || []).find(function (r) {
          return (
            String(r.session_id) === String(sessionId) &&
            String(r.student_name || "").toLowerCase().trim() === name
          );
        });
      }
      if (!existing || !existing.checkin_at) throw new Error("Belum check-in");
      if (existing.checkout_at) throw new Error("Sudah check-out");

      var sessions = await SheetsDB.listRows("attendance_sessions", { limit: 300 });
      var sess = (sessions || []).find(function (x) {
        return String(x.id) === String(sessionId);
      });
      var checkout_status = "on_time";
      if (sess) {
        function jakartaMinutes() {
          var fmt = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          var parts = Object.fromEntries(
            fmt.formatToParts(new Date()).map(function (p) {
              return [p.type, p.value];
            })
          );
          return parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
        }
        function toMin(t) {
          var p = String(t || "0:0").slice(0, 5).split(":");
          return parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10);
        }
        var mins = jakartaMinutes();
        var co1 = toMin(sess.checkout_end);
        if (mins > co1) checkout_status = "late";
      }

      var now = new Date().toISOString();
      var row = Object.assign({}, existing, {
        checkout_at: now,
        checkout_note: String(note || "").slice(0, 120),
        checkout_status: checkout_status,
        updated_at: now,
      });
      return SheetsDB.upsertRow("attendance_records", row);
    },

    /** Blob/File → base64 (tanpa prefix data:) */
    _blobToBase64: function (blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          var s = String(reader.result || "");
          var i = s.indexOf(",");
          resolve(i >= 0 ? s.slice(i + 1) : s);
        };
        reader.onerror = function () {
          reject(new Error("Gagal baca file"));
        };
        reader.readAsDataURL(blob);
      });
    },

    /**
     * Upload media via GAS → Google Drive (mode Sheets; hindari Supabase Storage/quota).
     * File sangat kecil (&lt;32KB) bisa fallback data-URL jika Drive belum diotorisasi.
     */
    uploadMediaViaGas: async function (blobOrFile, kind) {
      if (!blobOrFile) throw new Error("Tidak ada file");
      var max = kind === "image" ? 1.5 * 1024 * 1024 : 2.5 * 1024 * 1024;
      if (blobOrFile.size > max) {
        throw new Error(
          kind === "image"
            ? "Gambar terlalu besar untuk mode Sheet (maks ~1.5 MB)"
            : "Pesan suara terlalu besar untuk mode Sheet (maks ~2.5 MB)"
        );
      }
      var type = String(blobOrFile.type || (kind === "image" ? "image/jpeg" : "audio/webm"));
      var name =
        (blobOrFile.name && String(blobOrFile.name)) ||
        (kind === "image" ? "chat-img-" + Date.now() + ".jpg" : "voice-" + Date.now() + ".webm");
      var b64 = await SheetsDB._blobToBase64(blobOrFile);
      try {
        var data = await gasCall("uploadMedia", {
          data: b64,
          mime: type,
          name: name,
          kind: kind || "file",
        });
        if (!data || !data.url) throw new Error((data && data.error) || "Upload gagal");
        return data.url;
      } catch (err) {
        var msg = String((err && err.message) || err || "");
        var needsDrive =
          /DriveApp|auth\/drive|izin.*Drive|tidak memiliki izin|authorization/i.test(msg);
        // Fallback data-URL hanya untuk file sangat kecil (agar pesan tetap terkirim)
        if (blobOrFile.size <= 32 * 1024) {
          var dataUrl = "data:" + type + ";base64," + b64;
          return dataUrl;
        }
        if (needsDrive) {
          throw new Error(
            "Izin Google Drive di Apps Script belum diaktifkan.\n\n" +
              "Lakukan sekali ini:\n" +
              "1. Buka project Apps Script (ClassSheetsBackend)\n" +
              "2. Pilih fungsi setupDriveMedia → Run ▶️\n" +
              "3. Review permissions → Allow (Google Drive)\n" +
              "4. Deploy → Manage deployments → New version → Deploy\n\n" +
              "Detail: " +
              msg.slice(0, 180)
          );
        }
        throw err;
      }
    },

    uploadChatAudio: async function (blobOrFile) {
      return SheetsDB.uploadMediaViaGas(blobOrFile, "audio");
    },

    uploadChatImage: async function (blobOrFile) {
      return SheetsDB.uploadMediaViaGas(blobOrFile, "image");
    },

    /**
     * Hapus file media di Google Drive saat TTL habis / pesan dihapus.
     * Aturan TTL tetap di klien: 3h (siswa), 24h (guru), forever (admin).
     */
    deleteChatStorageByPublicUrl: async function (publicUrl) {
      var url = String(publicUrl || "");
      if (!url || /^data:/i.test(url)) return true;
      if (!/drive\.google\.com|docs\.google\.com/i.test(url) && !/[?&]id=/.test(url)) {
        return true;
      }
      try {
        await gasCall("deleteMedia", { url: url });
      } catch (e) {
        console.warn("deleteChatStorageByPublicUrl", e);
      }
      return true;
    },

    _mediaBlobCache: {},

    /**
     * URL Drive → blob: yang bisa diputar di <audio>.
     * (uc?export=download sering memicu "no supported sources")
     */
    getChatMediaBlobUrl: async function (publicUrl) {
      var url = String(publicUrl || "");
      if (!url) throw new Error("URL kosong");
      if (/^data:|^blob:/i.test(url)) return url;
      if (SheetsDB._mediaBlobCache[url]) return SheetsDB._mediaBlobCache[url];
      if (!/drive\.google\.com|docs\.google\.com/i.test(url) && !/[?&]id=/.test(url)) {
        return url;
      }
      var data = await gasCall("getMedia", { url: url });
      if (!data || !data.data) throw new Error((data && data.error) || "Gagal unduh media");
      var bin = atob(String(data.data).replace(/\s+/g, ""));
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var mime = data.mime || "audio/webm";
      if (!/^audio\//i.test(mime) && !/^video\//i.test(mime)) {
        var nm = String(data.name || url);
        if (/\.webm$/i.test(nm)) mime = "audio/webm";
        else if (/\.ogg$/i.test(nm)) mime = "audio/ogg";
        else if (/\.m4a$/i.test(nm)) mime = "audio/mp4";
        else if (/\.mp3$/i.test(nm)) mime = "audio/mpeg";
        else mime = "audio/webm";
      }
      var blobUrl = URL.createObjectURL(new Blob([arr], { type: mime }));
      SheetsDB._mediaBlobCache[url] = blobUrl;
      return blobUrl;
    },

    cleanupExpiredChatMedia: async function () {
      return gasCall("cleanupExpiredChatMedia", {});
    },

    // no-op realtime
    subscribeChat: function () {
      return { unsubscribe: function () {} };
    },
    subscribeAttendanceLive: function () {
      return { unsubscribe: function () {} };
    },
  };

  global.SheetsDB = SheetsDB;
  global.SHSheetsBackend = {
    getMode: getMode,
    setMode: setMode,
    sheetsReady: sheetsReady,
    supabaseAllowed: supabaseAllowed,
    setSupabaseAllowed: setSupabaseAllowed,
    firebaseAllowed: firebaseAllowed,
    setFirebaseAllowed: setFirebaseAllowed,
  };
})(typeof window !== "undefined" ? window : this);
