import { describe, expect, it } from "vitest"
import { evaluateCondition } from "@/features/engine/evaluator"
import type { EngineContext } from "@/features/engine/types"

function ctx(data: Record<string, unknown>): EngineContext {
  return {
    now: Date.now(),
    tickId: "T0000",
    target: { type: "stock", id: "s1", name: "测试股" },
    data,
  }
}

describe("evaluateCondition", () => {
  it("supports all/compare", () => {
    const res = evaluateCondition(
      {
        type: "all",
        children: [
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.a" },
            op: ">=",
            right: { kind: "const", value: 10 },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.b" },
            op: "<",
            right: { kind: "const", value: 5 },
          },
        ],
      },
      ctx({ metrics: { a: 10, b: 4 } }),
    )
    expect(res.matched).toBe(true)
  })

  it("supports any/not", () => {
    const res = evaluateCondition(
      {
        type: "any",
        children: [
          {
            type: "not",
            child: {
              type: "compare",
              left: { kind: "field", path: "data.metrics.a" },
              op: "==",
              right: { kind: "const", value: 1 },
            },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.b" },
            op: ">",
            right: { kind: "const", value: 10 },
          },
        ],
      },
      ctx({ metrics: { a: 1, b: 0 } }),
    )
    expect(res.matched).toBe(false)
  })
})

