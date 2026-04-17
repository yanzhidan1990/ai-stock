import type { Rule, Severity, TargetType } from "./types"

export function createEmptyRule(targetType: TargetType): Rule {
  const t = new Date().toISOString()
  return {
    id: `rule_${Math.random().toString(16).slice(2)}`,
    name: "新规则",
    enabled: true,
    severity: "WARN" satisfies Severity,
    dslVersion: "1",
    target: { type: targetType },
    condition: {
      type: "all",
      children: [
        {
          type: "compare",
          left: { kind: "field", path: "data.metrics.changePct" },
          op: ">=",
          right: { kind: "const", value: 1 },
        },
      ],
    },
    actions: [
      {
        type: "createAlert",
        title: "命中：{{targetName}}",
        dedupeWindowMs: 120_000,
        includePaths: ["target", "data", "data.metrics"],
        tags: [],
      },
    ],
    createdAt: t,
    updatedAt: t,
  }
}

