/**
 * GalleryDB adapter — Google Apps Script + Spreadsheet (mode primer Class)
 * Chat: polling, bukan realtime.
 */
(function (global) {
  "use strict";
  var LS_MODE = "sh_class_db_mode_v1";
  var LS_SESSION = "sh_class_sheets_session_v1";

  function cfg() {
    return global.SH_DB_BACKEND_CONFIG || {};
  }

  function getMode() {
    try {
      var m = localStorage.getItem(LS_MODE);
      if (m === "sheets" || m === "supabase" || m === "firebase") return m;
    } catch (e) {}
    return cfg().primary || "sheets";
  }

  function setMode(m) {
    try {
      localStorage.setItem(LS_MODE, m);
    } catch (e) {}
    try {
      cfg().primary = m;
    } catch (e2) {}
  }

  function supabaseAllowed() {
    try {
      var v = localStorage.getItem("sh_class_allow_supabase");
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {}
    return !!cfg().allowSupabase;
  }

  function setSupabaseAllowed(on) {
    try {
      localStorage.setItem("sh_class_allow_supabase", on ? "1" : "0");
    } catch (e) {}
    cfg().allowSupabase = !!on;
  }

  function firebaseAllowed() {
    try {
      var v = localStorage.getItem("sh_class_allow_firebase");
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {}
    return !!cfg().allowFirebase;
  }

  function setFirebaseAllowed(on) {
    try {
      localStorage.setItem("sh_class_allow_firebase", on ? "1" : "0");
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
    if (!url) throw new Error("gasUrl belum diisi di data/db-backend-config.js");
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
      var o = JSON.parse(localStorage.getItem(LS_SESSION) || "null");
      if (!o || !o.exp || Date.now() > o.exp) {
        localStorage.removeItem(LS_SESSION);
        return null;
      }
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeSession(o) {
    var hours = Number(cfg().sessionHours) || 8;
    var s = {
      ok: true,
      role: o.role || "admin",
      name: o.name || "Admin",
      email: o.email || "admin-sheets@local",
      token: o.token || ("t-" + Date.now()),
      exp: Date.now() + hours * 3600 * 1000,
    };
    localStorage.setItem(LS_SESSION, JSON.stringify(s));
    return s;
  }

  function clearSession() {
    try {
      localStorage.removeItem(LS_SESSION);
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
          id: "sheets-" + (s.email || "admin"),
          email: s.email,
          user_metadata: { full_name: s.name, name: s.name },
        },
      };
    },

    signInWithGoogle: async function () {
      if (!supabaseAllowed() && getMode() !== "supabase") {
        throw new Error(
          "Login Google nonaktif. Admin belum mengaktifkan Supabase di panel backend."
        );
      }
      throw new Error("Login Google hanya tersedia saat backend Supabase aktif.");
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
      var data = await gasCall("list", {
        table: table,
        filter: (opts && opts.filter) || null,
        limit: (opts && opts.limit) || 500,
      });
      return data.rows || [];
    },

    upsertRow: async function (table, row) {
      var data = await gasCall("upsert", { table: table, row: row || {} });
      return data.row || row;
    },

    deleteRow: async function (table, id) {
      await gasCall("delete", { table: table, id: id });
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
    listChatMessages: async function (roomId, limit) {
      var rows = await SheetsDB.listRows("chat_messages", { limit: limit || 200 });
      if (roomId) {
        rows = rows.filter(function (r) {
          return String(r.room_id) === String(roomId);
        });
      }
      rows.sort(function (a, b) {
        return String(a.created_at || "").localeCompare(String(b.created_at || ""));
      });
      return rows;
    },
    insertChatMessage: async function (payload) {
      payload.created_at = payload.created_at || new Date().toISOString();
      if (!payload.id) payload.id = "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      return SheetsDB.upsertRow("chat_messages", payload);
    },
    clearChatMessages: async function (roomId) {
      await gasCall("clearChat", { room_id: roomId });
      return true;
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
      return SheetsDB.listRows("alumni", { limit: 2000 });
    },
    listAngkatan: async function () {
      return SheetsDB.listRows("angkatan", { limit: 100 });
    },
    adminListWebsites: async function () {
      return SheetsDB.listRows("websites", { limit: 500 });
    },
    listVideosAdmin: async function () {
      return SheetsDB.listRows("videos", { limit: 500 });
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
