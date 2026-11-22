/**
 * Silverhawk Class — database primer via Google Sheet (FIX setValues / merge)
 *
 * SETUP:
 * 1. Spreadsheet baru → catat ID
 * 2. script.google.com → tempel SELURUH file ini (ganti Code.gs lama)
 * 3. Script Properties:
 *      SPREADSHEET_ID, ADMIN_PASSWORD, (opsional) ADMIN_LABEL
 * 4. Deploy → Web app → Execute as Me, Anyone
 * 5. gasUrl di data/db-backend-config.js
 *
 * Setelah update: Deploy lagi (New version).
 * Buka Sheet tab chat_rooms / chat_messages → Format → Merge cells → Unmerge jika ada.
 */

var TABS = [
  "ai_skills",
  "alumni",
  "angkatan",
  "announcement_reads",
  "announcements",
  "app_settings",
  "attendance_records",
  "attendance_sessions",
  "chat_messages",
  "chat_reactions",
  "chat_rooms",
  "content_snapshots",
  "designs",
  "events",
  "profiles",
  "reactions",
  "refleksi",
  "settings",
  "skills_meta",
  "student_aliases",
  "video_categories",
  "videos",
  "websites",
  "users",
  "_meta",
];

function doGet(e) {
  if (e && e.parameter && e.parameter.ping === "1") {
    return json_({ ok: true, service: "class-sheets-backend", ts: Date.now() });
  }
  return json_({ ok: false, error: "POST JSON required" });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = String(body.action || "");
    if (action === "adminLogin") return adminLogin_(body);
    if (action === "userLogin") return userLogin_(body);
    if (action === "adminResetUserPassword") return adminResetUserPassword_(body);
    if (action === "userChangePassword") return userChangePassword_(body);
    if (action === "listLoginDirectory") return listLoginDirectory_(body);
    if (action === "list") return list_(body);
    if (action === "upsert") return upsert_(body);
    if (action === "importBulk") return importBulk_(body);
    if (action === "delete") return delete_(body);
    if (action === "clearChat") return clearChat_(body);
    if (action === "ping") return json_({ ok: true, ts: Date.now() });
    return json_({ ok: false, error: "action unknown: " + action });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function ss_() {
  var id = props_().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("SPREADSHEET_ID belum di-set di Script Properties");
  return SpreadsheetApp.openById(id);
}

function ensureTab_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1).setValue("id");
    sh.getRange(1, 2).setValue("json");
    sh.getRange(1, 3).setValue("updated_at");
    return sh;
  }
  try {
    var maxR = Math.max(sh.getMaxRows(), 2);
    var maxC = Math.max(sh.getMaxColumns(), 3);
    sh.getRange(1, 1, maxR, maxC).breakApart();
  } catch (e0) {}
  var h1 = String(sh.getRange(1, 1).getValue() || "");
  if (!h1 || h1.toLowerCase() !== "id") {
    sh.getRange(1, 1).setValue("id");
    sh.getRange(1, 2).setValue("json");
    sh.getRange(1, 3).setValue("updated_at");
  }
  return sh;
}

function adminLogin_(body) {
  var expected = props_().getProperty("ADMIN_PASSWORD");
  if (!expected) return json_({ ok: false, error: "ADMIN_PASSWORD belum di-set" });
  if (String(body.password || "") !== expected) {
    Utilities.sleep(400);
    return json_({ ok: false, error: "Password salah" });
  }
  var label = props_().getProperty("ADMIN_LABEL") || "Admin Class";
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put("tok_" + token, "admin", 21600);
  return json_({ ok: true, label: label, email: "admin-class@sheets.local", token: token });
}

function list_(body) {
  var table = String(body.table || "");
  if (TABS.indexOf(table) < 0 && table.charAt(0) !== "_") {
    return json_({ ok: false, error: "table invalid" });
  }
  var sh = ensureTab_(table);
  var last = sh.getLastRow();
  if (last < 2) return json_({ ok: true, rows: [] });
  var values = sh.getRange(1, 1, last, 3).getValues();
  var rows = [];
  var limit = Number(body.limit) || 500;
  for (var i = 1; i < values.length && rows.length < limit; i++) {
    var id = values[i][0];
    var js = values[i][1];
    if (!id) continue;
    var obj = {};
    try {
      obj = JSON.parse(js);
    } catch (e) {
      obj = { id: id, raw: String(js) };
    }
    obj.id = obj.id || id;
    rows.push(obj);
  }
  return json_({ ok: true, rows: rows });
}

function findRowById_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

/** Tulis 1 baris — SEL PER SEL (hindari error setValues vs merge) */
function writeLine_(sh, sheetRow, line) {
  try {
    sh.getRange(sheetRow, 1, sheetRow, 3).breakApart();
  } catch (e1) {}
  sh.getRange(sheetRow, 1).setValue(line[0]);
  sh.getRange(sheetRow, 2).setValue(line[1]);
  sh.getRange(sheetRow, 3).setValue(line[2]);
}

/** Dipakai importRoomsOnce / importMessagesOnce */
function upsertRow_(table, row) {
  if (!row || typeof row !== "object") return;
  if (!row.id) row.id = Utilities.getUuid();
  var sh = ensureTab_(table);
  var id = String(row.id);
  var line = [id, JSON.stringify(row), new Date().toISOString()];
  var found = findRowById_(sh, id);
  if (found > 0) {
    writeLine_(sh, found, line);
  } else {
    var next = Math.max(sh.getLastRow() + 1, 2);
    writeLine_(sh, next, line);
  }
}

function upsert_(body) {
  var table = String(body.table || "");
  var row = body.row || {};
  upsertRow_(table, row);
  return json_({ ok: true, row: row });
}

function importBulk_(body) {
  var expected = props_().getProperty("ADMIN_PASSWORD");
  if (String(body.password || "") !== expected) {
    return json_({ ok: false, error: "Password salah" });
  }
  var table = String(body.table || "");
  var rows = body.rows || [];
  if (TABS.indexOf(table) < 0) return json_({ ok: false, error: "table invalid" });
  if (!rows.length) return json_({ ok: true, imported: 0 });

  ensureTab_(table);
  var n = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    if (table === "chat_rooms" && row.access_password === null) row.access_password = "";
    if (table === "chat_messages") {
      row.display_name = row.author_name || row.display_name || "Anonim";
      row.avatar = row.avatar_emoji || row.avatar || "💬";
    }
    upsertRow_(table, row);
    n++;
    // jeda ringan tiap 40 baris agar tidak kehabisan waktu
    if (n % 40 === 0) Utilities.sleep(50);
  }
  return json_({ ok: true, imported: n });
}

function delete_(body) {
  var table = String(body.table || "");
  var id = String(body.id || "");
  var sh = ensureTab_(table);
  var found = findRowById_(sh, id);
  if (found > 0) sh.deleteRow(found);
  return json_({ ok: true });
}

function clearChat_(body) {
  var room = String(body.room_id || "");
  var sh = ensureTab_("chat_messages");
  var last = sh.getLastRow();
  if (last < 2) return json_({ ok: true, cleared: 0 });
  var values = sh.getRange(1, 1, last, 3).getValues();
  var cleared = 0;
  for (var i = values.length - 1; i >= 1; i--) {
    var obj = {};
    try {
      obj = JSON.parse(values[i][1]);
    } catch (e) {
      obj = {};
    }
    if (!room || String(obj.room_id || "") === room) {
      sh.deleteRow(i + 1);
      cleared++;
    }
  }
  return json_({ ok: true, cleared: cleared });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Jalankan dari editor GAS (Run) — import 10 ruang.
 * Tidak lewat chat-migrate.html.
 */
function importRoomsOnce() {
  var ROOMS_JSON = [
    {
      id: "71ed5a8c-6531-468d-af8f-f32b3ccbc69c",
      name: "Lintas angkatan (global)",
      description: "Ruang gabungan semua angkatan (histori global). legacy_global",
      access_password: "",
      is_active: true,
      sort_order: 0,
      created_at: "2026-10-24 07:10:31.955467+00",
    },
    {
      id: "c5c0cf90-a741-41bb-a77d-96fcd4b9a603",
      name: "52 Task",
      description: "ruang diskusi kelas 52",
      access_password: "",
      is_active: true,
      sort_order: 0,
      created_at: "2026-10-26 04:49:56.482698+00",
    },
    {
      id: "350643ec-144f-4218-8586-63122b9fa916",
      name: "Tugas 52",
      description: "kumpulin tugas khusus santriw 52",
      access_password: "Bismillaah",
      is_active: true,
      sort_order: 0,
      created_at: "2026-10-29 06:23:54.304533+00",
    },
    {
      id: "fafa9f1e-e633-4c73-a18d-83e7af8c2248",
      name: "51 - Tugas Pengembangan",
      description: "Tempat submit tugas pengembangan website kelas 51",
      access_password: "Bismillaah",
      is_active: true,
      sort_order: 0,
      created_at: "2026-11-04 03:52:30.976034+00",
    },
    {
      id: "7913167c-bf15-4501-be98-760c6763b51f",
      name: "52 - Tugas Pengembangan",
      description: "Pengumpulan tugas pengambengan Web",
      access_password: "Bismillaah",
      is_active: true,
      sort_order: 0,
      created_at: "2026-11-04 06:20:52.964454+00",
    },
    {
      id: "a7530f42-3e1d-4550-b9cc-d997704387db",
      name: "51 Task",
      description: "Diskusi tugas santriw 51",
      access_password: "",
      is_active: true,
      sort_order: 2,
      created_at: "2026-10-24 06:41:08.905934+00",
    },
    {
      id: "46dd0542-642b-4ced-a980-2109e33e69bd",
      name: "Ang. 2025",
      description: "Ruang dari angkatan (migrasi otomatis).",
      access_password: "",
      is_active: true,
      sort_order: 3,
      created_at: "2026-10-24 06:51:24.225735+00",
    },
    {
      id: "806e9d60-2776-442d-90a4-63ecb38544d2",
      name: "Ang. 2024",
      description: "Ruang dari angkatan (migrasi otomatis).",
      access_password: "",
      is_active: true,
      sort_order: 4,
      created_at: "2026-10-24 06:51:24.225735+00",
    },
    {
      id: "34a931ef-17dc-4297-a158-312c46a5142f",
      name: "Secret Room",
      description: "Chat rahasia tim Bacon Boy",
      access_password: "Amanah0328*",
      is_active: true,
      sort_order: 4,
      created_at: "2026-10-24 07:34:11.134861+00",
    },
    {
      id: "98e81c68-2cab-4f0b-b1d9-0f1c2fb83baa",
      name: "Ang. 2023",
      description: "Ruang dari angkatan (migrasi otomatis).",
      access_password: "",
      is_active: true,
      sort_order: 10,
      created_at: "2026-10-24 06:51:24.225735+00",
    },
  ];
  ROOMS_JSON.forEach(function (row) {
    if (row.access_password === null) row.access_password = "";
    upsertRow_("chat_rooms", row);
  });
  Logger.log("importRoomsOnce done: " + ROOMS_JSON.length);
}

/**
 * Untuk pesan: JANGAN tempel ribuan baris di sini.
 * Pakai tools/chat-migrate.html (importBulk) batch 50–100,
 * atau tempel subset MSGS_JSON lalu Run importMessagesOnce.
 */
function importMessagesOnce() {
  var MSGS_JSON = []; // isi array kecil, atau pakai chat-migrate.html
  if (!MSGS_JSON.length) {
    Logger.log("MSGS_JSON kosong — pakai chat-migrate.html dengan action importBulk");
    return;
  }
  MSGS_JSON.forEach(function (row) {
    row.display_name = row.author_name || row.display_name || "Anonim";
    row.avatar = row.avatar_emoji || row.avatar || "💬";
    upsertRow_("chat_messages", row);
  });
  Logger.log("importMessagesOnce done: " + MSGS_JSON.length);
}

/** Utility: unmerge semua tab chat */
function fixUnmergeChatTabs() {
  ["chat_rooms", "chat_messages"].forEach(function (name) {
    var sh = ensureTab_(name);
    try {
      sh.getRange(1, 1, sh.getMaxRows(), Math.max(3, sh.getMaxColumns())).breakApart();
    } catch (e) {}
  });
  Logger.log("unmerge done");
}

/** SHA-256 hex */
function hashPw_(plain) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(plain || ""), Utilities.Charset.UTF_8);
  return raw.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

var DEFAULT_USER_PASSWORD = "Bismillaah";

function findUserRow_(sh, pred) {
  var last = sh.getLastRow();
  if (last < 2) return null;
  var values = sh.getRange(2, 1, last, 3).getValues();
  for (var i = 0; i < values.length; i++) {
    var id = values[i][0];
    var js = values[i][1];
    if (!id) continue;
    var obj = {};
    try { obj = JSON.parse(js); } catch (e) { continue; }
    obj.id = obj.id || id;
    if (pred(obj)) return { sheetRow: i + 2, user: obj };
  }
  return null;
}

/** Direktori login: angkatan + alumni (untuk dropdown) */
function listLoginDirectory_(body) {
  var angkatan = [];
  var alumni = [];
  try {
    var shA = ensureTab_("angkatan");
    var lastA = shA.getLastRow();
    if (lastA >= 2) {
      var va = shA.getRange(2, 1, lastA, 3).getValues();
      for (var i = 0; i < va.length; i++) {
        try {
          var o = JSON.parse(va[i][1] || "{}");
          o.id = o.id || va[i][0];
          angkatan.push(o);
        } catch (e1) {}
      }
    }
  } catch (eA) {}
  try {
    var shU = ensureTab_("alumni");
    var lastU = shU.getLastRow();
    if (lastU >= 2) {
      var vu = shU.getRange(2, 1, lastU, 3).getValues();
      for (var j = 0; j < vu.length; j++) {
        try {
          var a = JSON.parse(vu[j][1] || "{}");
          a.id = a.id || vu[j][0];
          alumni.push({
            id: a.id,
            name: a.name || a.display_name || "",
            class_code: a.class_code || a.class || "",
            angkatan_id: a.angkatan_id || "",
            angkatan_year: a.angkatan_year || a.year || "",
            role: a.role || "student",
          });
        } catch (e2) {}
      }
    }
  } catch (eU) {}
  return json_({ ok: true, angkatan: angkatan, alumni: alumni });
}

/**
 * Login siswa/pengajar: angkatan + nama + password
 * Default password pertama: Bismillaah → must_change_password
 */
function userLogin_(body) {
  var name = String(body.name || body.display_name || "").trim();
  var angkatanYear = String(body.angkatan_year || body.year || "").trim();
  var classCode = String(body.class_code || "").trim();
  var alumniId = String(body.alumni_id || "").trim();
  var password = String(body.password || "");
  if (!name && !alumniId) return json_({ ok: false, error: "Nama / alumni wajib" });
  if (!password) return json_({ ok: false, error: "Password wajib" });

  var sh = ensureTab_("users");
  var found = findUserRow_(sh, function (u) {
    if (alumniId && String(u.alumni_id || "") === alumniId) return true;
    var sameName = String(u.display_name || u.name || "").toLowerCase() === name.toLowerCase();
    var sameYear = !angkatanYear || String(u.angkatan_year || "") === angkatanYear;
    var sameClass = !classCode || String(u.class_code || "") === classCode;
    return sameName && sameYear && sameClass;
  });

  var user = found ? found.user : null;
  if (!user) {
    // buat user baru dari alumni (password default)
    user = {
      id: alumniId || Utilities.getUuid(),
      alumni_id: alumniId || "",
      display_name: name,
      name: name,
      angkatan_year: angkatanYear,
      class_code: classCode,
      role: String(body.role || "student"),
      password_hash: hashPw_(DEFAULT_USER_PASSWORD),
      must_change_password: true,
      active: true,
      created_at: new Date().toISOString(),
    };
    // hanya izinkan password default untuk user baru
    if (hashPw_(password) !== user.password_hash) {
      return json_({ ok: false, error: "Password salah. Password awal: Bismillaah" });
    }
    upsertRow_("users", user);
  } else {
    if (user.active === false) return json_({ ok: false, error: "Akun nonaktif" });
    var expect = user.password_hash || hashPw_(DEFAULT_USER_PASSWORD);
    if (hashPw_(password) !== expect) {
      Utilities.sleep(300);
      return json_({ ok: false, error: "Password salah" });
    }
  }

  var token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    "tok_" + token,
    JSON.stringify({
      role: user.role || "student",
      name: user.display_name || user.name,
      user_id: user.id,
      alumni_id: user.alumni_id || "",
    }),
    28800
  );
  return json_({
    ok: true,
    token: token,
    user: {
      id: user.id,
      name: user.display_name || user.name,
      email: user.google_email || "",
      role: user.role || "student",
      alumni_id: user.alumni_id || "",
      angkatan_year: user.angkatan_year || "",
      class_code: user.class_code || "",
      must_change_password: !!user.must_change_password,
    },
  });
}

function adminResetUserPassword_(body) {
  var expected = props_().getProperty("ADMIN_PASSWORD");
  if (String(body.password || body.admin_password || "") !== expected) {
    return json_({ ok: false, error: "Password admin salah" });
  }
  var userId = String(body.user_id || body.id || "").trim();
  var alumniId = String(body.alumni_id || "").trim();
  var newPw = String(body.new_password || DEFAULT_USER_PASSWORD);
  var sh = ensureTab_("users");
  var found = findUserRow_(sh, function (u) {
    if (userId && String(u.id) === userId) return true;
    if (alumniId && String(u.alumni_id || "") === alumniId) return true;
    return false;
  });
  if (!found) {
    // buat user stub
    var u = {
      id: userId || alumniId || Utilities.getUuid(),
      alumni_id: alumniId || userId || "",
      display_name: String(body.display_name || body.name || "User"),
      name: String(body.display_name || body.name || "User"),
      angkatan_year: String(body.angkatan_year || ""),
      class_code: String(body.class_code || ""),
      role: String(body.role || "student"),
      password_hash: hashPw_(newPw),
      must_change_password: true,
      active: true,
      created_at: new Date().toISOString(),
    };
    upsertRow_("users", u);
    return json_({ ok: true, reset: true, created: true, user_id: u.id });
  }
  found.user.password_hash = hashPw_(newPw);
  found.user.must_change_password = true;
  upsertRow_("users", found.user);
  return json_({ ok: true, reset: true, created: false, user_id: found.user.id });
}

function userChangePassword_(body) {
  var token = String(body.token || "");
  var cache = CacheService.getScriptCache().get("tok_" + token);
  if (!cache) return json_({ ok: false, error: "Sesi tidak valid" });
  var meta = {};
  try { meta = JSON.parse(cache); } catch (e) { meta = { user_id: cache }; }
  var userId = String(meta.user_id || body.user_id || "");
  var oldPw = String(body.old_password || "");
  var newPw = String(body.new_password || "");
  if (!newPw || newPw.length < 6) return json_({ ok: false, error: "Password baru minimal 6 karakter" });
  var sh = ensureTab_("users");
  var found = findUserRow_(sh, function (u) { return String(u.id) === userId; });
  if (!found) return json_({ ok: false, error: "User tidak ditemukan" });
  var expect = found.user.password_hash || hashPw_(DEFAULT_USER_PASSWORD);
  if (oldPw && hashPw_(oldPw) !== expect) return json_({ ok: false, error: "Password lama salah" });
  found.user.password_hash = hashPw_(newPw);
  found.user.must_change_password = false;
  upsertRow_("users", found.user);
  return json_({ ok: true });
}
