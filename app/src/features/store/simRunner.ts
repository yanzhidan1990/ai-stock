import { RuleEngine } from "@/features/engine/engine"
import type { Alert, EngineContext } from "@/features/engine/types"
import { generateTick } from "@/features/data/sim/generator"
import type { SimTick } from "@/features/data/sim/types"
import { getAppStoreState } from "./appStore"

type RunnerState = {
  running: boolean
  seq: number
  lastTick: SimTick | null
}

const engine = new RuleEngine()
const state: RunnerState = { running: false, seq: 0, lastTick: null }

function evaluateTick(tick: SimTick): Alert[] {
  const { rules, pushAlerts } = getAppStoreState().get()
  const out: Alert[] = []

  for (const c of tick.concepts) {
    const ctx: EngineContext = {
      now: tick.now,
      tickId: tick.tickId,
      target: { type: "concept", id: c.concept.id, name: c.concept.name },
      data: { concept: c.concept, metrics: c.metrics },
    }
    out.push(...engine.evaluateAll(rules, ctx))
  }

  for (const s of tick.stocks) {
    const ctx: EngineContext = {
      now: tick.now,
      tickId: tick.tickId,
      target: { type: "stock", id: s.stock.id, name: `${s.stock.name} ${s.stock.code}` },
      data: {
        stock: s.stock,
        concept: s.concept,
        metrics: s.metrics,
      },
    }
    out.push(...engine.evaluateAll(rules, ctx))
  }

  pushAlerts(out)
  return out
}

export function getSimRunnerState(): RunnerState {
  return { ...state }
}

export function stepSim(): { tick: SimTick; alerts: Alert[] } {
  state.seq += 1
  const tick = generateTick(state.seq)
  state.lastTick = tick
  const alerts = evaluateTick(tick)
  return { tick, alerts }
}

export function startSim(options?: { intervalMs?: number }): () => void {
  const intervalMs = options?.intervalMs ?? 4_000
  if (state.running) return () => stopSim()
  state.running = true
  const id = window.setInterval(() => {
    if (!state.running) return
    stepSim()
  }, intervalMs)
  return () => {
    window.clearInterval(id)
    state.running = false
  }
}

export function stopSim(): void {
  state.running = false
}

export function resetSim(): void {
  state.running = false
  state.seq = 0
  state.lastTick = null
}
