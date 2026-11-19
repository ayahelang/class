/**
 * Class: routing database
 * primary default = Sheets; Supabase/Firebase hanya jika diizinkan admin.
 */
(function (global) {
  "use strict";

  function mode() {
    if (global.SHSheetsBackend) return SHSheetsBackend.getMode();
    var c = global.SH_DB_BACKEND_CONFIG || {};
    return c.primary || "sheets";
  }

  function useSheets() {
    return mode() === "sheets" && global.SheetsDB && SheetsDB.enabled();
  }

  function patchGalleryDB() {
    if (!global.GalleryDB) return;
    var G = global.GalleryDB;
    var S = global.SheetsDB;
    if (!S) return;

    // Simpan referensi supabase asli
    if (!global.__GalleryDB_Supabase) {
      global.__GalleryDB_Supabase = {};
      Object.keys(G).forEach(function (k) {
        if (typeof G[k] === "function") {
          global.__GalleryDB_Supabase[k] = G[k].bind(G);
        }
      });
    }
    var SB = global.__GalleryDB_Supabase;

    function pick(name) {
      return function () {
        var args = arguments;
        if (useSheets() && typeof S[name] === "function") {
          return S[name].apply(S, args);
        }
        // Supabase hanya jika diizinkan
        if (mode() === "supabase" || (name === "signInWithGoogle" && S.supabaseAllowed && S.supabaseAllowed())) {
          if (typeof SB[name] === "function") return SB[name].apply(null, args);
        }
        if (useSheets() && typeof S[name] === "function") return S[name].apply(S, args);
        if (typeof SB[name] === "function") {
          // fallback baca supabase hanya jika allow
          if (S.supabaseAllowed && S.supabaseAllowed()) return SB[name].apply(null, args);
        }
        if (typeof S[name] === "function") return S[name].apply(S, args);
        return Promise.resolve(null);
      };
    }

    var names = [
      "enabled",
      "getSession",
      "signInWithGoogle",
      "signOut",
      "requireAdmin",
      "isCurrentUserAdmin",
      "getMyProfile",
      "upsertMyProfileFromSession",
      "listAnnouncementsAdmin",
      "listAnnouncementsPublic",
      "upsertAnnouncement",
      "deleteAnnouncement",
      "listAttendanceSessionsAdmin",
      "upsertAttendanceSession",
      "deleteAttendanceSession",
      "listAttendanceRecords",
      "listChatRooms",
      "upsertChatRoom",
      "deleteChatRoom",
      "listChatMessages",
      "insertChatMessage",
      "clearChatMessages",
      "verifyChatRoomAccess",
      "adminListAlumni",
      "listAngkatan",
      "adminListWebsites",
      "subscribeChat",
      "subscribeAttendanceLive",
    ];

    // enabled: true jika sheets ready ATAU supabase ready+allowed
    G.enabled = function () {
      if (useSheets()) return true;
      if (S.supabaseAllowed && S.supabaseAllowed() && SB.enabled) return SB.enabled();
      if (sheetsReadySilent()) return true;
      return SB.enabled ? SB.enabled() : false;
    };

    function sheetsReadySilent() {
      try {
        return !!(global.SH_DB_BACKEND_CONFIG && SH_DB_BACKEND_CONFIG.gasUrl);
      } catch (e) {
        return false;
      }
    }

    names.forEach(function (n) {
      if (n === "enabled") return;
      if (typeof S[n] === "function" || typeof SB[n] === "function") {
        G[n] = pick(n);
      }
    });

    // admin password login helper
    G.adminLoginPassword = function (pw) {
      if (S.adminLoginPassword) return S.adminLoginPassword(pw);
      return Promise.reject(new Error("Sheets backend belum siap"));
    };

    G.getBackendMode = function () {
      return mode();
    };
    G.setBackendMode = function (m) {
      if (S.setBackendMode) S.setBackendMode(m);
    };
  }

  function boot() {
    patchGalleryDB();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  // patch again after short delay (db.js may load order)
  setTimeout(boot, 0);
  setTimeout(boot, 50);
  global.SHDbRouterClass = { patch: patchGalleryDB, mode: mode };
})(typeof window !== "undefined" ? window : this);
