export interface ChartData {
    state: string
    state_full: string
    city: string
    airport_name: string
    military: 'Y' | 'N'
    faa_ident: string
    icao_ident: string
    chart_seq: number
    chart_code: string
    chart_name: string
    pdf_name: string
    pdf_path: string
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

export interface Chart {
    chartSeq: number
    chartCode: string
    chartName: string
    pdfName: string
    pdfPath: string
}