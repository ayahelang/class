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

    // chat.js memakai listChat / sendChat (bukan listChatMessages / insertChatMessage)
    G.listChat = function (opts) {
      opts = opts || {};
      if (useSheets() && S.listChatMessages) {
        return S.listChatMessages(opts.roomId || null, opts.limit || 200).then(function (rows) {
          return (rows || []).map(function (r) {
            return {
              id: r.id,
              room_id: r.room_id || null,
              angkatan_id: r.angkatan_id || null,
              user_id: r.user_id || null,
              author_name: r.author_name || r.display_name || r.author || "Anonim",
              avatar_emoji: r.avatar_emoji || r.avatar || "💬",
              body: r.body || "",
              reply_to: r.reply_to || null,
              created_at: r.created_at || null,
              updated_at: r.updated_at || r.created_at || null,
              is_registered: !!r.is_registered,
              edit_count: r.edit_count || 0,
              edit_history: r.edit_history || null,
            };
          });
        });
      }
      if (typeof SB.listChat === "function") return SB.listChat(opts);
      return Promise.resolve([]);
    };

    G.sendChat = function (opts) {
      opts = opts || {};
      if (useSheets() && S.insertChatMessage) {
        var row = {
          room_id: opts.roomId || null,
          angkatan_id: opts.angkatanId || null,
          author_name: opts.authorName || "Anonim",
          body: opts.body || "",
          avatar_emoji: opts.avatarEmoji || "💬",
          reply_to: opts.replyTo || null,
          user_id: null,
          is_registered: false,
          created_at: new Date().toISOString(),
        };
        return S.insertChatMessage(row);
      }
      if (typeof SB.sendChat === "function") return SB.sendChat(opts);
      return Promise.reject(new Error("sendChat tidak tersedia"));
    };

    G.listChatReactions = function () {
      if (useSheets()) return Promise.resolve({});
      if (typeof SB.listChatReactions === "function") return SB.listChatReactions.apply(null, arguments);
      return Promise.resolve({});
    };
    G.toggleChatReaction = function () {
      if (useSheets()) return Promise.resolve({});
      if (typeof SB.toggleChatReaction === "function") return SB.toggleChatReaction.apply(null, arguments);
      return Promise.resolve({});
    };
    G.updateChat = function (opts) {
      if (useSheets() && S.upsertRow) {
        return S.upsertRow("chat_messages", {
          id: opts.id,
          body: opts.body,
          updated_at: new Date().toISOString(),
        });
      }
      if (typeof SB.updateChat === "function") return SB.updateChat(opts);
      return Promise.resolve(null);
    };
    G.deleteChat = function (id) {
      if (useSheets() && S.deleteRow) return S.deleteRow("chat_messages", id);
      if (typeof SB.deleteChat === "function") return SB.deleteChat(id);
      return Promise.resolve(null);
    };

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
