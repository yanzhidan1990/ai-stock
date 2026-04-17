import { evaluateCondition } from "./evaluator"
import { AlertDeduper } from "./dedupe"
import { renderTemplate } from "./templating"
import type { Action, Alert, EngineContext, Rule, RuleEvaluationResult, Severity } from "./types"

function createId(prefix: string, now: number): string {
  return `${prefix}_${now}_${Math.random().toString(16).slice(2)}`
}

function pickPaths(ctx: EngineContext, includePaths: string[] | undefined): Record<string, unknown> {
  if (!includePaths || includePaths.length === 0) return { target: ctx.target, data: ctx.data }
  const payload: Record<string, unknown> = {}
  for (const p of includePaths) {
    if (p === "target") payload.target = ctx.target
    if (p === "data") payload.data = ctx.data
    if (p.startsWith("data.") && typeof ctx.data === "object" && ctx.data !== null) {
      payload[p] = (ctx.data as Record<string, unknown>)[p.slice("data.".length)]
    }
    if (p.startsWith("target.")) {
      payload[p] = (ctx.target as Record<string, unknown>)[p.slice("target.".length)]
    }
  }
  return payload
}

function normalizeSeverity(ruleSeverity: Severity, action: Action): Severity {
  if (action.type === "createAlert" && action.severity) return action.severity
  return ruleSeverity
}

export class RuleEngine {
  private readonly deduper = new AlertDeduper()

  evaluateRule(rule: Rule, ctx: EngineContext): RuleEvaluationResult {
    if (!rule.enabled) return { matched: false, alerts: [], evidence: {} }
    if (rule.target.type !== ctx.target.type) return { matched: false, alerts: [], evidence: {} }

    const { matched, evidence } = evaluateCondition(rule.condition, ctx)
    if (!matched) return { matched: false, alerts: [], evidence }

    const alerts: Alert[] = []
    for (const action of rule.actions) {
      if (action.type !== "createAlert") continue
      const sev = normalizeSeverity(rule.severity, action)
      const dedupeWindowMs = action.dedupeWindowMs ?? 60_000
      const vars = {
        ruleId: rule.id,
        ruleName: rule.name,
        targetType: ctx.target.type,
        targetId: ctx.target.id ?? "",
        targetName: ctx.target.name ?? "",
      }
      const dedupeKeyTemplate =
        action.dedupeKeyTemplate ?? "rule={{ruleId}};target={{targetType}}:{{targetId}};title={{title}}"
      const dedupeKey = renderTemplate(dedupeKeyTemplate, { ...vars, title: action.title })

      if (!this.deduper.shouldEmit(dedupeKey, ctx.now, dedupeWindowMs)) continue

      alerts.push({
        id: createId("alert", ctx.now),
        ruleId: rule.id,
        severity: sev,
        title: renderTemplate(action.title, vars),
        dedupeKey,
        payload: {
          tickId: ctx.tickId,
          rule: { id: rule.id, name: rule.name },
          target: ctx.target,
          evidence,
          data: pickPaths(ctx, action.includePaths),
          tags: action.tags ?? [],
        },
        createdAt: new Date(ctx.now).toISOString(),
      })
    }

    return { matched: true, alerts, evidence }
  }

  evaluateAll(rules: Rule[], ctx: EngineContext): Alert[] {
    const out: Alert[] = []
    for (const r of rules) {
      const res = this.evaluateRule(r, ctx)
      if (res.alerts.length) out.push(...res.alerts)
    }
    return out
  }
}

