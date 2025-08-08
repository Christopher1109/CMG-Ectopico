import { NextResponse } from "next/server"
import { getSheets } from "../../lib/sheets"

export async function GET() {
  const details = {
    hasId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
    hasKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    worksheetTitle: process.env.GOOGLE_SHEETS_WORKSHEET_TITLE || null,
  }
  try {
    const sheets = await getSheets()
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
    const sheetTitle = process.env.GOOGLE_SHEETS_WORKSHEET_TITLE || "Pruebas"

    const now = new Date().toISOString()
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:W`,
      valueInputOption: "RAW",
      requestBody: { values: [[`DEBUG-${now}`, "desde /api/debug"]] },
    })

    return NextResponse.json({ ok: true, details })
  } catch (e: any) {
    return NextResponse.json({ ok: false, details, error: e?.message || String(e) }, { status: 500 })
  }
}
