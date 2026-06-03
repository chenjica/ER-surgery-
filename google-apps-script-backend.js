const SHEET_NAME = "reviews";
const SPREADSHEET_ID = "17aOihQiPmaOPyHZBGPVpqK8BtcmVO8GNkwQMNIBsxV4";

function doPost(e) {
  const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
  const sheet = getReviewSheet_();
  const id = Utilities.getUuid();
  const createdAt = payload.createdAt || new Date().toISOString();
  const counts = payload.counts || {};
  const sourceFile = payload.sourceFile || {};

  sheet.appendRow([
    id,
    createdAt,
    payload.fileName || "",
    sourceFile.name || "",
    counts.total || 0,
    counts.ok || 0,
    counts.bad || 0,
    counts.check || 0,
    JSON.stringify({
      id,
      createdAt,
      fileName: payload.fileName || "",
      sourceFile,
      counts,
      reviewPackage: payload.reviewPackage || null,
      reviewHtml: payload.reviewHtml || ""
    })
  ]);

  return output_({ ok: true, id });
}

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const sheet = getReviewSheet_();
  const values = sheet.getDataRange().getValues();
  const items = values.slice(1).map(row => {
    try {
      return JSON.parse(row[8] || "{}");
    } catch (error) {
      return null;
    }
  }).filter(Boolean).reverse();
  return output_({ ok: true, items }, callback);
}

function getReviewSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "createdAt", "fileName", "sourceFile", "total", "ok", "bad", "check", "json"]);
  }
  return sheet;
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  const body = callback ? `${callback}(${json});` : json;
  return ContentService
    .createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
