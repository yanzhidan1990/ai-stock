import { RuleEngine } from "@/features/engine/engine"
import type { Alert, EngineContext } from "@/features/engine/types"
import { getAppStoreState } from "@/features/store/appStore"
import { getQuotes, type StockInfo } from "@/lib/api"

type RealRunnerState = {
  running: boolean;
  seq: number;
  lastQuotes: any[] | null;
}

const engine = new RuleEngine()
const state: RealRunnerState = { running: false, seq: 0, lastQuotes: null }

export async function stepReal(): Promise<{ quotes: any[], alerts: Alert[] }> {
  state.seq += 1;
  const { rules, pushAlerts, selectedStocks } = getAppStoreState().get();
  
  if (!selectedStocks.length) {
    return { quotes: [], alerts: [] };
  }

  const fullCodes = selectedStocks.map(s => s.fullCode);
  const quotes = await getQuotes(fullCodes);
  state.lastQuotes = quotes;
  
  const now = Date.now();
  const tickId = `real_${state.seq}`;
  const out: Alert[] = [];

  for (const q of quotes) {
    // Map to EngineContext structure expected by rules
    const ctx: EngineContext = {
      now,
      tickId,
      target: { type: "stock", id: q.fullCode, name: `${q.name} ${q.fullCode.substring(2)}` },
      data: {
        stock: { id: q.fullCode, code: q.fullCode.substring(2), name: q.name, market: q.fullCode.substring(0, 2) },
        // Simulate a concept for rules that require data.concept
        concept: { id: "c_custom", name: "自选股" }, 
        metrics: {
          changePct: q.changePct,
          price: q.price,
          changeAmt: q.changeAmt,
          turnoverRate: q.turnoverRate,
          amplitude: q.amplitude,
          volumeRatio: q.volumeRatio,
          volumeMoney: q.volumeMoney,
          relStrengthConcept: q.changePct / 100, // mock mapping
          pullbackPct: 0 // mock mapping
        },
      },
    };
    out.push(...engine.evaluateAll(rules, ctx));
  }

  pushAlerts(out);
  return { quotes, alerts: out };
}

let currentTimer: number | null = null;

export function startReal(options?: { intervalMs?: number }): () => void {
  const intervalMs = options?.intervalMs ?? 3_000;
  if (state.running) return () => stopReal();
  
  state.running = true;
  
  const loop = async () => {
    if (!state.running) return;
    await stepReal();
    if (state.running) {
      currentTimer = window.setTimeout(loop, intervalMs);
    }
  };
  
  loop();
  
  return () => stopReal();
}

export function stopReal(): void {
  state.running = false;
  if (currentTimer !== null) {
    window.clearTimeout(currentTimer);
    currentTimer = null;
  }
}

export function getRealRunnerState(): RealRunnerState {
  return { ...state }
}
