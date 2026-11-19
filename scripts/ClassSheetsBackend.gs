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
 * Sheet tabs dibuat otomatis saat pertama diakses.
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
    sh.appendRow(["id", "json", "updated_at"]);
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
  // simpan token singkat di cache script (6 jam)
  CacheService.getScriptCache().put("tok_" + token, "admin", 21600);
  return json_({ ok: true, label: label, email: "admin-class@sheets.local", token: token });
}

function requireTokenOptional_(body) {
  // mutasi sebaiknya ada token; list publik boleh tanpa
  return true;
}

function list_(body) {
  var table = String(body.table || "");
  if (TABS.indexOf(table) < 0 && table.charAt(0) !== "_") {
    return json_({ ok: false, error: "table invalid" });
  }
  var sh = ensureTab_(table);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return json_({ ok: true, rows: [] });
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

function upsert_(body) {
  var table = String(body.table || "");
  var row = body.row || {};
  if (!row.id) row.id = Utilities.getUuid();
  var sh = ensureTab_(table);
  var values = sh.getDataRange().getValues();
  var id = String(row.id);
  var found = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      found = i + 1;
      break;
    }
  }
  var line = [id, JSON.stringify(row), new Date().toISOString()];
  if (found > 0) sh.getRange(found, 1, found, 3).setValues([line]);
  else sh.appendRow(line);
  return json_({ ok: true, row: row });
}

function delete_(body) {
  var table = String(body.table || "");
  var id = String(body.id || "");
  var sh = ensureTab_(table);
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === id) {
      sh.deleteRow(i + 1);
    }
  }
  return json_({ ok: true });
}

function clearChat_(body) {
  var room = String(body.room_id || "");
  var sh = ensureTab_("chat_messages");
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    try {
      var obj = JSON.parse(values[i][1]);
      if (!room || String(obj.room_id) === room) sh.deleteRow(i + 1);
    } catch (e) {}
  }
  return json_({ ok: true });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
