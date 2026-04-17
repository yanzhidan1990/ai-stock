export type Concept = {
  id: string
  name: string
}

export type Stock = {
  id: string
  code: string
  name: string
  conceptId: string
  tier: "龙头" | "次核心" | "补涨" | "容量" | "弹性"
}

export type ConceptMetrics = {
  changePct: number
  turnover: number
  limitUpCount: number
  failRate: number
  moneyInflow: number
}

export type StockMetrics = {
  changePct: number
  volumeRatio: number
  relStrengthConcept: number
  pullbackPct: number
}

export type ConceptSnapshot = {
  concept: Concept
  metrics: ConceptMetrics
}

export type StockSnapshot = {
  stock: Stock
  concept: Concept
  metrics: StockMetrics
}

export type SimTick = {
  tickId: string
  now: number
  concepts: ConceptSnapshot[]
  stocks: StockSnapshot[]
}

