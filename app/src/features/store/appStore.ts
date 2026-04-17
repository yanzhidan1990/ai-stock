import { create } from "zustand"
import type { Alert, Rule } from "@/features/engine/types"
import { createTemplateRules } from "@/features/engine/templates"
import { localPersist, safeJsonParse } from "./persist"

const LS_KEYS = {
  rules: "ai-trader.rules.v1",
  alerts: "ai-trader.alerts.v1",
}

type AppState = {
  rules: Rule[]
  alerts: Alert[]
  selectedConceptId: string | null
  selectedStockId: string | null
  setSelectedConceptId: (id: string | null) => void
  setSelectedStockId: (id: string | null) => void
  upsertRule: (rule: Rule) => void
  toggleRule: (ruleId: string) => void
  deleteRule: (ruleId: string) => void
  resetRulesToTemplates: () => void
  pushAlerts: (alerts: Alert[]) => void
  clearAlerts: () => void
}

function loadRules(): Rule[] {
  const v = safeJsonParse<Rule[]>(localPersist.getItem(LS_KEYS.rules))
  if (v && Array.isArray(v) && v.length) return v
  return createTemplateRules()
}

function loadAlerts(): Alert[] {
  const v = safeJsonParse<Alert[]>(localPersist.getItem(LS_KEYS.alerts))
  if (v && Array.isArray(v)) return v
  return []
}

export const useAppStore = create<AppState>((set, get) => ({
  rules: loadRules(),
  alerts: loadAlerts(),
  selectedConceptId: null,
  selectedStockId: null,
  setSelectedConceptId: (id) => set({ selectedConceptId: id }),
  setSelectedStockId: (id) => set({ selectedStockId: id }),
  upsertRule: (rule) => {
    set((s) => {
      const next = s.rules.some((r) => r.id === rule.id) ? s.rules.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...s.rules]
      localPersist.setItem(LS_KEYS.rules, JSON.stringify(next))
      return { rules: next }
    })
  },
  toggleRule: (ruleId) => {
    set((s) => {
      const next = s.rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r,
      )
      localPersist.setItem(LS_KEYS.rules, JSON.stringify(next))
      return { rules: next }
    })
  },
  deleteRule: (ruleId) => {
    set((s) => {
      const next = s.rules.filter((r) => r.id !== ruleId)
      localPersist.setItem(LS_KEYS.rules, JSON.stringify(next))
      return { rules: next }
    })
  },
  resetRulesToTemplates: () => {
    const next = createTemplateRules()
    localPersist.setItem(LS_KEYS.rules, JSON.stringify(next))
    set({ rules: next })
  },
  pushAlerts: (alerts) => {
    if (alerts.length === 0) return
    set((s) => {
      const merged = [...alerts, ...s.alerts].slice(0, 500)
      localPersist.setItem(LS_KEYS.alerts, JSON.stringify(merged))
      return { alerts: merged }
    })
  },
  clearAlerts: () => {
    localPersist.setItem(LS_KEYS.alerts, JSON.stringify([]))
    set({ alerts: [] })
  },
}))

export function getAppStoreState(): { get: () => AppState; set: typeof useAppStore.setState } {
  return { get: useAppStore.getState, set: useAppStore.setState }
}
