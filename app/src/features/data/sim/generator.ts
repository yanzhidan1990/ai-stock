import type { Concept, ConceptSnapshot, SimTick, Stock, StockSnapshot } from "./types"

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function rnd(seed: number): () => number {
  let x = seed % 2147483647
  if (x <= 0) x += 2147483646
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

function jitter(r: () => number, base: number, span: number): number {
  return base + (r() * 2 - 1) * span
}

const concepts: Concept[] = [
  { id: "c_ai_model", name: "AI 大模型" },
  { id: "c_ai_compute", name: "AI 算力" },
  { id: "c_ai_robot", name: "机器人" },
  { id: "c_ai_app", name: "AI 应用" },
]

const stocks: Stock[] = [
  { id: "s_001", code: "300001", name: "智算科技", conceptId: "c_ai_compute", tier: "容量" },
  { id: "s_002", code: "300002", name: "算力先锋", conceptId: "c_ai_compute", tier: "龙头" },
  { id: "s_003", code: "300003", name: "模型工坊", conceptId: "c_ai_model", tier: "龙头" },
  { id: "s_004", code: "300004", name: "数据底座", conceptId: "c_ai_model", tier: "次核心" },
  { id: "s_005", code: "300005", name: "灵巧机器人", conceptId: "c_ai_robot", tier: "龙头" },
  { id: "s_006", code: "300006", name: "协作执行", conceptId: "c_ai_robot", tier: "补涨" },
  { id: "s_007", code: "300007", name: "AI 助手", conceptId: "c_ai_app", tier: "弹性" },
  { id: "s_008", code: "300008", name: "行业智能", conceptId: "c_ai_app", tier: "容量" },
]

export function getSimUniverse(): { concepts: Concept[]; stocks: Stock[] } {
  return { concepts, stocks }
}

export function generateTick(seq: number): SimTick {
  const r = rnd(1000 + seq * 97)
  const now = Date.now() + seq * 15_000
  const tickId = `T${seq.toString().padStart(4, "0")}`

  const conceptSnaps: ConceptSnapshot[] = concepts.map((c, idx) => {
    const changePct = clamp(jitter(r, 0.6 + idx * 0.15, 1.2), -3.5, 6.5)
    const turnover = clamp(jitter(r, 2_500_000_000, 1_800_000_000), 200_000_000, 8_000_000_000)
    const limitUpCount = Math.floor(clamp(jitter(r, 2 + idx * 0.6, 2.5), 0, 10))
    const failRate = clamp(jitter(r, 0.18 + idx * 0.04, 0.22), 0, 0.8)
    const moneyInflow = clamp(jitter(r, 45_000_000 - idx * 4_000_000, 35_000_000), -80_000_000, 120_000_000)
    return {
      concept: c,
      metrics: { changePct, turnover, limitUpCount, failRate, moneyInflow },
    }
  })

  const conceptById = new Map(concepts.map((c) => [c.id, c]))
  const conceptMetaById = new Map(conceptSnaps.map((cs) => [cs.concept.id, cs]))

  const stockSnaps: StockSnapshot[] = stocks.map((s) => {
    const concept = conceptById.get(s.conceptId)!
    const cm = conceptMetaById.get(s.conceptId)!.metrics
    const base = clamp(cm.changePct + jitter(r, 0.0, 1.6), -6.5, 14.5)
    const changePct = base
    const volumeRatio = clamp(jitter(r, 1.25 + Math.max(0, base) / 10, 0.85), 0.2, 6.0)
    const relStrengthConcept = clamp(jitter(r, 0.55 + Math.max(0, base - cm.changePct) / 10, 0.35), 0, 1.5)
    const pullbackPct = clamp(jitter(r, 2.2 - Math.max(0, base) / 10, 1.6), 0, 9)
    return {
      stock: s,
      concept,
      metrics: { changePct, volumeRatio, relStrengthConcept, pullbackPct },
    }
  })

  return { tickId, now, concepts: conceptSnaps, stocks: stockSnaps }
}

