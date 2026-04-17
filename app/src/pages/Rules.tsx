import { useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Tag } from "@/components/ui/Tag"
import { createEmptyRule } from "@/features/engine/factory"
import type { Rule, TargetType } from "@/features/engine/types"
import { validateRule } from "@/features/engine/validate"
import { useAppStore } from "@/features/store/appStore"
import { cn } from "@/lib/utils"
import { Check, Copy, Plus, RotateCcw, Save, Trash2 } from "lucide-react"

export default function Rules() {
  const { rules, toggleRule, deleteRule, resetRulesToTemplates, upsertRule } = useAppStore()
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(rules[0]?.id ?? null)
  const selectedRule = useMemo(() => rules.find((r) => r.id === selectedRuleId) ?? null, [rules, selectedRuleId])
  const [draftJson, setDraftJson] = useState<string>(() => (selectedRule ? JSON.stringify(selectedRule, null, 2) : ""))
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  function loadRuleIntoEditor(rule: Rule | null) {
    setSelectedRuleId(rule?.id ?? null)
    setDraftJson(rule ? JSON.stringify(rule, null, 2) : "")
    setJsonError(null)
    setSaveOk(false)
  }

  function createRule(target: TargetType) {
    const r = createEmptyRule(target)
    upsertRule(r)
    loadRuleIntoEditor(r)
  }

  function tryParseDraft(): Rule | null {
    setJsonError(null)
    setSaveOk(false)
    try {
      const obj = JSON.parse(draftJson) as Rule
      return obj
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON 解析失败")
      return null
    }
  }

  function saveDraft() {
    const obj = tryParseDraft()
    if (!obj) return
    const errors = validateRule(obj)
    if (errors.length) {
      setJsonError(errors.join("；"))
      return
    }
    const next: Rule = { ...obj, updatedAt: new Date().toISOString() }
    upsertRule(next)
    setSaveOk(true)
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader
              title="规则列表"
              subTitle="启停/选择规则，右侧编辑 JSON（MVP）"
              right={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resetRulesToTemplates()}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
                  >
                    <RotateCcw className="h-4 w-4 text-zinc-200" />
                    重置模板
                  </button>
                </div>
              }
            />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => createRule("stock")}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-900"
                >
                  <Plus className="h-4 w-4 text-cyan-200" />
                  新建个股规则
                </button>
                <button
                  type="button"
                  onClick={() => createRule("concept")}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-900"
                >
                  <Plus className="h-4 w-4 text-cyan-200" />
                  新建概念规则
                </button>
              </div>

              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "rounded-lg border bg-zinc-950 px-3 py-2",
                      selectedRuleId === r.id ? "border-cyan-500/30 bg-cyan-500/10" : "border-zinc-800",
                    )}
                  >
                    <button type="button" className="flex w-full items-start justify-between gap-2 text-left" onClick={() => loadRuleIntoEditor(r)}>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-zinc-100">{r.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                          <span className="tabular-nums">{r.target.type}</span>
                          <span className="tabular-nums">DSL {r.dslVersion}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Tag tone={r.severity}>{r.severity}</Tag>
                      </div>
                    </button>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRule(r.id)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs transition",
                          r.enabled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900",
                        )}
                      >
                        {r.enabled ? "已启用" : "已停用"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteRule(r.id)
                          if (selectedRuleId === r.id) loadRuleIntoEditor(rules.find((x) => x.id !== r.id) ?? null)
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-900"
                      >
                        <Trash2 className="h-4 w-4 text-amber-200" />
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title="规则编辑器"
              subTitle={selectedRule ? "编辑 JSON → 校验 → 保存（保存后立即影响盘中告警）" : "请从左侧选择或新建规则"}
              right={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedRule) return
                      navigator.clipboard.writeText(draftJson)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
                  >
                    <Copy className="h-4 w-4 text-zinc-200" />
                    复制
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const obj = tryParseDraft()
                      if (!obj) return
                      const errors = validateRule(obj)
                      setJsonError(errors.length ? errors.join("；") : null)
                      setSaveOk(!errors.length)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
                  >
                    <Check className="h-4 w-4 text-cyan-200" />
                    校验
                  </button>
                  <button
                    type="button"
                    onClick={() => saveDraft()}
                    className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-xs text-zinc-100 transition hover:bg-fuchsia-500/15"
                  >
                    <Save className="h-4 w-4 text-fuchsia-200" />
                    保存
                  </button>
                </div>
              }
            />
            <CardBody className="space-y-3">
              {selectedRule ? (
                <>
                  <textarea
                    value={draftJson}
                    onChange={(e) => {
                      setDraftJson(e.target.value)
                      setJsonError(null)
                      setSaveOk(false)
                    }}
                    spellCheck={false}
                    className="h-[520px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-xs leading-5 text-zinc-100 outline-none ring-0 focus:border-cyan-500/40"
                  />
                  {jsonError ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{jsonError}</div>
                  ) : saveOk ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">校验通过</div>
                  ) : (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
                      字段提示：数据路径通常是 data.metrics.*；告警标题支持 {"{{targetName}}"} 变量
                    </div>
                  )}

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Tag tone="INFO">模拟字段</Tag>
                      <span>概念：data.metrics.changePct / limitUpCount / failRate / moneyInflow</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Tag tone="INFO">模拟字段</Tag>
                      <span>个股：data.metrics.changePct / volumeRatio / relStrengthConcept / pullbackPct</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm text-zinc-400">未选择规则</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
