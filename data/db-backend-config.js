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
  gasUrl: "https://script.google.com/macros/s/AKfycbyd_GEx0QdcBI-ZXcQKwbwvBQ_jEfWQiBaVkD48CET7qPBKQtp3GI4XBz6HpV1p7AhWag/exec",
  /** Spreadsheet ID (opsional, dicatat di GAS Script Properties lebih aman) */
  spreadsheetId: "1zGAOJtOqUYBxzHWQpO1Eqt6Wjp6zZbGdYa2PqbI9PeE",
  /** izinkan fallback/aktifkan supabase (bisa diubah admin di panel) */
  allowSupabase: false,
  allowFirebase: false,
  /** polling chat interval ms (Sheets tidak realtime) */
  chatPollMs: 8000,
  sessionHours: 8,
};
