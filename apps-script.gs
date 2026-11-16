/**
 * EKEY REALTY ✦ invoice tracker team sync — Google Apps Script
 * ------------------------------------------------------------
 * What it does
 *   1. Stores the shared tracker data in one JSON file in your Google Drive
 *   2. Mirrors every invoice / expense / month into tabs of THIS Google Sheet
 *   3. Puts every open reminder on a shared Google Calendar ("Ekey Realty reminders")
 *      with a 15-minute pop-up, and removes it when it's marked done
 *   4. Saves uploaded invoice PDFs / receipts into a Drive folder, one sub-folder per month
 *
 * Setup (5 minutes)
 *   a. Create a Google Sheet (e.g. "Invoice Tracker — live").
 *   b. Extensions → Apps Script → paste this whole file → change SECRET below.
 *   c. Project Settings (gear) → set the Time zone to yours.
 *   d. Deploy → New deployment → type "Web app"
 *        Execute as: Me      Who has access: Anyone
 *      Authorize when asked, then copy the URL that ends in /exec.
 *   e. In the tracker → Settings → Team sync: paste the URL and the same SECRET.
 *      Your coworker pastes the same two values on her computer.
 *   f. Share the "Ekey Realty reminders" calendar with your coworker in Google Calendar
 *      (it appears after the first sync that has a reminder).
 *   g. Share the "Ekey Realty — invoice copies" Drive folder with your coworker once
 *      (it appears after the first upload), so she can open every PDF.
 *
 * Updating this script later: Deploy → Manage deployments → pencil icon →
 * Version: "New version" → Deploy. The /exec URL stays the same.
 */

const SECRET = 'change-me-to-a-long-random-phrase';
const DATA_FILE = 'ekey-realty-tracker-data.json';
const CALENDAR_NAME = 'Ekey Realty reminders';   // set to '' to switch calendar automation off
const COPIES_FOLDER_ID = '';                 // optional: paste the ID of an existing Drive folder for invoice copies
const COPIES_FOLDER_NAME = 'Ekey Realty — invoice copies';   // used when COPIES_FOLDER_ID is blank

function doGet(e) {
  if ((e.parameter.key || '') !== SECRET) return json_({ error: 'unauthorized' });
  const text = file_().getBlob().getDataAsString() || '{}';
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ error: 'bad json' }); }
  if ((body.key || '') !== SECRET) return json_({ error: 'unauthorized' });
  if (body.action === 'upload') return upload_(body);
  const data = body.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.invoices)) return json_({ error: 'no tracker data in request' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    file_().setContent(JSON.stringify(data));
    mirrorSheet_(data);
    if (CALENDAR_NAME) syncCalendar_(data);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, at: Date.now() });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function file_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FILE_ID');
  if (id) { try { return DriveApp.getFileById(id); } catch (e) {} }
  const f = DriveApp.createFile(DATA_FILE, '{}', 'application/json');
  props.setProperty('FILE_ID', f.getId());
  return f;
}

/* ---------- invoice PDF / receipt uploads ---------- */
function upload_(body) {
  if (!body.data) return json_({ error: 'no file' });
  const root = copiesFolder_();
  const month = String(body.folder || '').replace(/[^0-9-]/g, '');
  let target = root;
  if (month) { const it = root.getFoldersByName(month); target = it.hasNext() ? it.next() : root.createFolder(month); }
  const blob = Utilities.newBlob(Utilities.base64Decode(body.data), body.mime || 'application/pdf', String(body.name || 'invoice.pdf').slice(0, 180));
  const f = target.createFile(blob);
  return json_({ ok: true, url: f.getUrl(), id: f.getId() });
}
function copiesFolder_() {
  if (COPIES_FOLDER_ID) return DriveApp.getFolderById(COPIES_FOLDER_ID);
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('COPIES_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const it = DriveApp.getFoldersByName(COPIES_FOLDER_NAME), folder = it.hasNext() ? it.next() : DriveApp.createFolder(COPIES_FOLDER_NAME);
  props.setProperty('COPIES_ID', folder.getId());
  return folder;
}

/* ---------- Google Sheet mirror ---------- */
function mirrorSheet_(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  const inv = (d.invoices || []).filter(i => !i._del).sort((a, b) => String(b.inputDate || '').localeCompare(String(a.inputDate || '')));
  const exp = (d.expenses || []).filter(x => !x._del);
  const extra = id => exp.filter(x => x.invoiceId === id).reduce((t, x) => t + (+x.amount || 0), 0);
  const recv = i => { const p = (i.payments || []).filter(x => !x._del); return p.length ? p.reduce((t, x) => t + (+x.amount || 0), 0) : (i.paid ? (+i.amount || 0) : 0); };
  const lastComm = i => { const c = (i.comms || []).filter(x => !x.sys).map(x => x.date).sort(); return c.length ? c[c.length - 1] : i.inputDate; };

  const rows = [['Invoice #', 'Input date', 'Client', 'Property', 'Type of service', 'Invoicing system', 'Amount invoiced', 'Amount received', 'Short-pay', 'Vendor', 'Vendor cost', 'Vendor paid', 'Net profit', 'Seller approval', 'Payment received', 'Paid date', 'Last communication', 'Invoice copy', 'Entered by', 'Month']];
  inv.forEach(i => {
    const r = recv(i), short = i.paid ? Math.max(0, (+i.amount || 0) - r) : 0;
    const p = (i.paid ? r : (+i.amount || 0)) - (+i.vendorCost || 0) - extra(i.id);
    rows.push([i.no || '', i.inputDate || '', i.client || '', i.property || '', i.service || '', i.system || '', +i.amount || 0, r, short, i.vendor || '', +i.vendorCost || 0, i.vendorPaid ? 'Yes' : 'No', p,
      i.approval || 'pending', i.paid ? 'Yes' : 'No', i.paidDate || '', lastComm(i) || '', i.copyUrl || '', i.enteredBy || '', String(i.inputDate || '').slice(0, 7)]);
  });
  write_(ss, 'Invoices', rows);

  const er = [['Date', 'Category', 'Payee', 'Amount', 'Linked invoice', 'Note']];
  exp.forEach(x => er.push([x.date || '', x.category || '', x.payee || '', +x.amount || 0, (inv.find(i => i.id === x.invoiceId) || {}).no || '', x.note || '']));
  write_(ss, 'Expenses', er);

  const m = {};
  const row = k => (m[k] = m[k] || { n: 0, r: 0, v: 0, o: 0 });
  inv.forEach(i => { const o = row(String(i.inputDate || '').slice(0, 7)); o.n++; o.r += (i.paid ? recv(i) : (+i.amount || 0)); o.v += (+i.vendorCost || 0) + extra(i.id); });
  exp.filter(x => !x.invoiceId).forEach(x => { row(String(x.date || '').slice(0, 7)).o += +x.amount || 0; });
  const mr = [['Month', 'Invoices', 'Invoiced (less short-pays)', 'Vendor & job costs', 'Job profit', 'Overhead', 'Monthly net']];
  Object.keys(m).sort().reverse().forEach(k => { const o = m[k]; mr.push([k, o.n, o.r, o.v, o.r - o.v, o.o, o.r - o.v - o.o]); });
  write_(ss, 'Monthly', mr);
}

function write_(ss, name, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
}

/* ---------- Google Calendar automation ---------- */
function syncCalendar_(d) {
  const cal = CalendarApp.getCalendarsByName(CALENDAR_NAME)[0] || CalendarApp.createCalendar(CALENDAR_NAME);
  const props = PropertiesService.getScriptProperties();
  const map = JSON.parse(props.getProperty('EVENT_MAP') || '{}');
  const since = +(props.getProperty('CAL_SINCE') || 0);
  const yesterday = Utilities.formatDate(new Date(Date.now() - 864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  (d.reminders || []).forEach(r => {
    const evId = map[r.id];
    if ((r.updatedAt || 0) <= since && evId) return;              // unchanged
    if (r._del || r.done) {
      if (evId) { try { cal.getEventById(evId).deleteEvent(); } catch (e) {} delete map[r.id]; }
      return;
    }
    if (!evId && r.date < yesterday) return;                       // don't back-fill old ones
    const [y, mo, da] = r.date.split('-').map(Number);
    const [h, mi] = (r.time || '09:00').split(':').map(Number);
    const start = new Date(y, mo - 1, da, h, mi), end = new Date(start.getTime() + 30 * 60000);
    const desc = (r.note || '') + '\n— from the Ekey Realty invoice tracker';
    if (evId) {
      try { const ev = cal.getEventById(evId); if (ev) { ev.setTitle(r.title); ev.setTime(start, end); ev.setDescription(desc); return; } } catch (e) {}
    }
    const ev = cal.createEvent(r.title, start, end, { description: desc });
    ev.removeAllReminders(); ev.addPopupReminder(15);
    map[r.id] = ev.getId();
  });
  props.setProperty('EVENT_MAP', JSON.stringify(map));
  props.setProperty('CAL_SINCE', String(Date.now()));
}
