import { describe, expect, it } from "vitest"
import { RuleEngine } from "@/features/engine/engine"
import type { EngineContext, Rule } from "@/features/engine/types"

function makeRule(): Rule {
  const t = new Date().toISOString()
  return {
    id: "r1",
    name: "规则1",
    enabled: true,
    severity: "WARN",
    dslVersion: "1",
    target: { type: "stock" },
    condition: {
      type: "compare",
      left: { kind: "field", path: "data.metrics.x" },
      op: ">=",
      right: { kind: "const", value: 1 },
    },
    actions: [
      {
        type: "createAlert",
        title: "命中：{{targetName}}",
        dedupeWindowMs: 60_000,
      },
    ],
    createdAt: t,
    updatedAt: t,
  }
}

function ctx(now: number, x: number): EngineContext {
  return {
    now,
    tickId: "T0001",
    target: { type: "stock", id: "s1", name: "测试股" },
    data: { metrics: { x } },
  }
}

describe("RuleEngine", () => {
  it("emits alert when matched", () => {
    const engine = new RuleEngine()
    const res = engine.evaluateRule(makeRule(), ctx(1000, 1))
    expect(res.matched).toBe(true)
    expect(res.alerts).toHaveLength(1)
    expect(res.alerts[0]?.title).toContain("测试股")
  })

  it("dedupes within window", () => {
    const engine = new RuleEngine()
    const rule = makeRule()
    const a1 = engine.evaluateRule(rule, ctx(1000, 2)).alerts
    const a2 = engine.evaluateRule(rule, ctx(2000, 2)).alerts
    const a3 = engine.evaluateRule(rule, ctx(62_000, 2)).alerts
    expect(a1).toHaveLength(1)
    expect(a2).toHaveLength(0)
    expect(a3).toHaveLength(1)
  })
})

