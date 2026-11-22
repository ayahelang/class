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
        // Mode sheets: JANGAN pernah jatuh ke Supabase (hindari quota/egress error)
        if (useSheets()) {
          if (typeof S[name] === "function") return S[name].apply(S, args);
          // stub aman
          if (name.indexOf("list") === 0 || name.indexOf("fetch") === 0) return Promise.resolve([]);
          if (name.indexOf("get") === 0) return Promise.resolve(null);
          return Promise.resolve(null);
        }
        if (mode() === "supabase" || (name === "signInWithGoogle" && S.supabaseAllowed && S.supabaseAllowed())) {
          if (typeof SB[name] === "function") return SB[name].apply(null, args);
        }
        if (typeof SB[name] === "function") {
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
      "listActiveAttendanceSessions",
      "myAttendanceRecords",
      "submitAttendanceCheckin",
      "submitAttendanceCheckout",
      "listChatRooms",
      "upsertChatRoom",
      "deleteChatRoom",
      "listChatMessages",
      "insertChatMessage",
      "clearChatMessages",
      "verifyChatRoomAccess",
      "adminListAlumni",
      "adminUpsertAlumni",
      "adminDeleteAlumni",
      "listAngkatan",
      "adminListAngkatanAll",
      "adminUpsertAngkatan",
      "adminDeleteAngkatan",
      "adminListWebsites",
      "adminUpsertWebsite",
      "adminDeleteWebsite",
      "listVideos",
      "listVideoCategories",
      "getStatsSummary",
      "getStatsTimeseries",
      "trackEvent",
      "joinPresenceOnline",
      "listVideosAdmin",
      "listDesigns",
      "listDesignsPublic",
      "adminListDesigns",
      "upsertDesign",
      "deleteDesign",
      "fetchGalleryFromDb",
      "listLoginDirectory",
      "userLoginPassword",
      "userChangePassword",
      "adminResetUserPassword",
      "listRegisteredUsers",
      "adminListLinks",
      "adminForceLinkProfile",
      "adminUnlinkProfile",
      "setUserAdmin",
      "adminDeleteUserProfile",
      "deleteUserProfiles",
      "uploadChatAudio",
      "uploadChatImage",
      "uploadMediaViaGas",
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
    G.updateChat = async function (opts) {
      opts = opts || {};
      if (useSheets() && S.upsertRow) {
        var prev = {};
        try {
          if (S.listChatMessages) {
            var all = await S.listChatMessages(null, 500);
            prev = (all || []).find(function (x) { return String(x.id) === String(opts.id); }) || {};
          }
        } catch (eP) {}
        var merged = Object.assign({}, prev, {
          id: opts.id,
          body: opts.body != null ? opts.body : prev.body,
          updated_at: new Date().toISOString(),
        });
        return S.upsertRow("chat_messages", merged);
      }
      if (typeof SB.updateChat === "function") return SB.updateChat(opts);
      return Promise.resolve(null);
    };
    G.deleteChat = function (arg) {
      // chat.js memanggil deleteChat({ id }) — bukan string id saja
      var id = arg;
      if (arg && typeof arg === "object") id = arg.id || arg.messageId || null;
      id = id != null ? String(id) : "";
      if (!id) return Promise.resolve(null);
      if (useSheets() && S.deleteRow) return S.deleteRow("chat_messages", id);
      if (typeof SB.deleteChat === "function") {
        // supabase db.js biasanya juga terima id string ATAU object
        try {
          return SB.deleteChat(arg);
        } catch (e0) {
          return SB.deleteChat(id);
        }
      }
      return Promise.resolve(null);
    };

    // admin password login helper
    G.adminLoginPassword = function (pw) {
      if (S.adminLoginPassword) return S.adminLoginPassword(pw);
      return Promise.reject(new Error("Sheets backend belum siap"));
    };

    G.fetchGalleryFromDb = function () {
      if (useSheets() && S.fetchGalleryFromDb) return S.fetchGalleryFromDb.apply(S, arguments);
      if (typeof SB.fetchGalleryFromDb === "function") return SB.fetchGalleryFromDb.apply(null, arguments);
      return Promise.resolve({ meta: {}, students: [] });
    };
    G.fetchGalleryData = G.fetchGalleryFromDb;

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
