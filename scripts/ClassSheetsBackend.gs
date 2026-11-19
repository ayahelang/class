/**
 * Silverhawk Class — database primer via Google Sheet
 *
 * SETUP:
 * 1. Buat Spreadsheet baru, catat ID-nya.
 * 2. script.google.com → project baru → tempel file ini.
 * 3. Script Properties:
 *      SPREADSHEET_ID = <id sheet>
 *      ADMIN_PASSWORD = <password admin class>
 *      ADMIN_LABEL = Admin Class (opsional)
 * 4. Deploy Web App: Execute as Me, Anyone
 * 5. Salin URL ke data/db-backend-config.js → gasUrl
 *
 * Sheet tabs: id | json | updated_at (dibuat otomatis)
 */

var TABS = [
  "announcements",
  "attendance_sessions",
  "attendance_records",
  "chat_rooms",
  "chat_messages",
  "alumni",
  "angkatan",
  "websites",
  "videos",
  "profiles",
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

/** Pastikan tab format: A=id, B=json, C=updated_at (tanpa merge) */
function ensureTab_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, 3).setValues([["id", "json", "updated_at"]]);
    return sh;
  }
  // Perbaiki header bila kosong / beda
  try {
    sh.getRange(1, 1, 1, 3).breakApart();
  } catch (e0) {}
  var h1 = String(sh.getRange(1, 1).getValue() || "");
  if (!h1 || h1.toLowerCase() !== "id") {
    sh.getRange(1, 1, 1, 3).setValues([["id", "json", "updated_at"]]);
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
      obj = { id: id, raw: js };
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

function writeLine_(sh, sheetRow, line) {
  // Selalu tulis tepat 1 baris x 3 kolom
  sh.getRange(sheetRow, 1, sheetRow, 3).setValues([line]);
}

function upsert_(body) {
  var table = String(body.table || "");
  var row = body.row || {};
  if (!row.id) row.id = Utilities.getUuid();
  var sh = ensureTab_(table);
  var id = String(row.id);
  var line = [id, JSON.stringify(row), new Date().toISOString()];
  var found = findRowById_(sh, id);
  if (found > 0) {
    writeLine_(sh, found, line);
  } else {
    // append tanpa mengandalkan appendRow (lebih aman ke kolom tepat)
    var next = Math.max(sh.getLastRow() + 1, 2);
    writeLine_(sh, next, line);
  }
  return json_({ ok: true, row: row });
}

/** Bulk import — lebih cepat & stabil untuk migrasi */
function importBulk_(body) {
  var expected = props_().getProperty("ADMIN_PASSWORD");
  if (String(body.password || "") !== expected) {
    return json_({ ok: false, error: "Password salah" });
  }
  var table = String(body.table || "");
  var rows = body.rows || [];
  if (TABS.indexOf(table) < 0) return json_({ ok: false, error: "table invalid" });
  if (!rows.length) return json_({ ok: true, imported: 0 });

  var sh = ensureTab_(table);
  var n = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    if (!row.id) row.id = Utilities.getUuid();
    var id = String(row.id);
    var line = [id, JSON.stringify(row), new Date().toISOString()];
    var found = findRowById_(sh, id);
    if (found > 0) writeLine_(sh, found, line);
    else {
      var next = Math.max(sh.getLastRow() + 1, 2);
      writeLine_(sh, next, line);
    }
    n++;
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
