/** Terminal charts DTOs — wire-compatible with the Go API's vatsim.ChartSet. */

export interface Chart {
  chartSeq: number
  chartCode: string
  chartName: string
  pdfName: string
  pdfPath: string
}

export interface ChartSet {
  state: string
  fullState: string
  city: string
  airportName: string
  military: boolean
  faaIdent: string
  icaoIdent: string
  apd: Chart[]
  dp: Chart[]
  star: Chart[]
  iap: Chart[]
  min: Chart[]
  lah: Chart[]
}

/** Airport metadata subset from GET /api/airports/:icao. */
export interface AirportData {
  state: string
  fullState: string
  city: string
  airportName: string
  military: boolean
  faaIdent: string
  icaoIdent: string
}
