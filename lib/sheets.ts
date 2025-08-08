// lib/sheets.ts
import { google } from "googleapis"

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
const worksheetTitle = process.env.GOOGLE_SHEETS_WORKSHEET_TITLE || "Pruebas"

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL!
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ""
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n")

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

export async function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: "v4", auth })
}

export async function findRowById(id: string) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${worksheetTitle}!A2:W100000`,
  })
  const rows = res.data.values || []
  let rowIndex = -1
  let row: string[] | null = null

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if ((r[0] || "").toUpperCase() === id.toUpperCase()) {
      rowIndex = i + 2
      row = r
      break
    }
  }
  return { rowIndex, row }
}

export async function appendRow(values: (string | number | null | undefined)[]) {
  const sheets = await getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${worksheetTitle}!A:W`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  })
}

export async function updateRow(rowIndex: number, values: (string | number | null | undefined)[]) {
  const sheets = await getSheets()
  const range = `${worksheetTitle}!A${rowIndex}:W${rowIndex}`
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  })
}
