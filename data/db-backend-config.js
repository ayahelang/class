/**
 * Class version — backend database
 * primary: "sheets" | "supabase" | "firebase"
 * Supabase/Firebase hanya aktif jika diizinkan admin (atau override lokal).
 */
window.SH_DB_BACKEND_CONFIG = {
  siteId: "class",
  /** default primer */
  primary: "sheets",
  /** URL Web App Google Apps Script (ClassSheetsBackend.gs) */
  gasUrl: "",
  /** Spreadsheet ID (opsional, dicatat di GAS Script Properties lebih aman) */
  spreadsheetId: "",
  /** izinkan fallback/aktifkan supabase (bisa diubah admin di panel) */
  allowSupabase: false,
  allowFirebase: false,
  /** polling chat interval ms (Sheets tidak realtime) */
  chatPollMs: 8000,
  sessionHours: 8,
};
