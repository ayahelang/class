/**
 * Tempel ke project GAS yang sama dengan ClassSheetsBackend.gs
 * Atau gabungkan function di bawah ke file backend.
 *
 * Cara pakai cepat:
 * 1. Export JSON dari Supabase (lihat docs)
 * 2. Paste array ke variabel ROOMS_JSON / MSGS_JSON di bawah
 * 3. Run importRoomsOnce lalu importMessagesOnce di editor GAS
 */

var ROOMS_JSON = []; // [{id,name,description,access_password,is_active,sort_order,created_at}, ...]
var MSGS_JSON = [];  // [{id,room_id,display_name,body,created_at,...}, ...]

function importRoomsOnce() {
  ROOMS_JSON.forEach(function (row) {
    upsertRow_("chat_rooms", row);
  });
}

function importMessagesOnce() {
  MSGS_JSON.forEach(function (row) {
    upsertRow_("chat_messages", row);
  });
}

function upsertRow_(table, row) {
  if (!row.id) row.id = Utilities.getUuid();
  var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"));
  var sh = ss.getSheetByName(table);
  if (!sh) {
    sh = ss.insertSheet(table);
    sh.appendRow(["id", "json", "updated_at"]);
  }
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
}

/** Endpoint opsional: POST { action:"importBulk", table:"chat_messages", rows:[...], password:"..." } */
function handleImportBulk_(body) {
  var expected = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (String(body.password || "") !== expected) {
    return { ok: false, error: "Password salah" };
  }
  var table = String(body.table || "");
  var rows = body.rows || [];
  var n = 0;
  rows.forEach(function (row) {
    upsertRow_(table, row);
    n++;
  });
  return { ok: true, imported: n };
}
