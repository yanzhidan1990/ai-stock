import type { Rule } from "./types"

function nowIso(): string {
  return new Date().toISOString()
}

export function createTemplateRules(): Rule[] {
  const t = nowIso()
  return [
    {
      id: "rule_ai_super_expect",
      name: "超预期雷达（AI 概念内个股相对强度+量能）",
      enabled: true,
      severity: "WARN",
      dslVersion: "1",
      target: { type: "stock" },
      condition: {
        type: "all",
        children: [
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.relStrengthConcept" },
            op: ">=",
            right: { kind: "const", value: 0.8 },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.volumeRatio" },
            op: ">=",
            right: { kind: "const", value: 1.8 },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.pullbackPct" },
            op: "<=",
            right: { kind: "const", value: 2.5 },
          },
        ],
      },
      actions: [
        {
          type: "createAlert",
          title: "超预期：{{targetName}}（强度/量能）",
          severity: "CRITICAL",
          dedupeWindowMs: 120_000,
          includePaths: ["target", "data", "data.metrics", "data.concept"],
          tags: ["超预期", "AI"],
        },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "rule_concept_polarization",
      name: "板块分歧（炸板率高）",
      enabled: true,
      severity: "WARN",
      dslVersion: "1",
      target: { type: "concept" },
      condition: {
        type: "all",
        children: [
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.limitUpCount" },
            op: ">=",
            right: { kind: "const", value: 3 },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.failRate" },
            op: ">=",
            right: { kind: "const", value: 0.35 },
          },
        ],
      },
      actions: [
        {
          type: "createAlert",
          title: "分歧：{{targetName}}（炸板率偏高）",
          dedupeWindowMs: 180_000,
          includePaths: ["target", "data", "data.metrics"],
          tags: ["分歧"],
        },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "rule_concept_repair",
      name: "板块修复（分歧后回升）",
      enabled: true,
      severity: "INFO",
      dslVersion: "1",
      target: { type: "concept" },
      condition: {
        type: "all",
        children: [
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.failRate" },
            op: "<=",
            right: { kind: "const", value: 0.18 },
          },
          {
            type: "compare",
            left: { kind: "field", path: "data.metrics.moneyInflow" },
            op: ">=",
            right: { kind: "const", value: 30_000_000 },
          },
        ],
      },
      actions: [
        {
          type: "createAlert",
          title: "修复：{{targetName}}（炸板率回落/资金回流）",
          dedupeWindowMs: 300_000,
          includePaths: ["target", "data", "data.metrics"],
          tags: ["修复"],
        },
      ],
      createdAt: t,
      updatedAt: t,
    },
  ]
}

