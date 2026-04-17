import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Tag } from "@/components/ui/Tag"
import { useAppStore } from "@/features/store/appStore"
import { cn } from "@/lib/utils"
import { FileText, Trash2 } from "lucide-react"

export default function Review() {
  const { alerts, clearAlerts } = useAppStore()
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem("ai-trader.note.v1")
      if (v) setNote(v)
    } catch {
      //
    }
  }, [])

  const stats = useMemo(() => {
    const bySeverity = { INFO: 0, WARN: 0, CRITICAL: 0 }
    const byRule = new Map<string, number>()
    for (const a of alerts) {
      bySeverity[a.severity] += 1
      const key = String((a.payload.rule as { name?: string } | undefined)?.name ?? a.ruleId)
      byRule.set(key, (byRule.get(key) ?? 0) + 1)
    }
    const topRules = Array.from(byRule.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
    return { bySeverity, topRules }
  }, [alerts])

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader
              title="当日摘要（基于告警）"
              subTitle="MVP：以规则命中为核心线索组织复盘"
              right={
                <button
                  type="button"
                  onClick={() => clearAlerts()}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4 text-amber-200" />
                  清空告警
                </button>
              }
            />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                  <div className="text-[11px] text-zinc-500">INFO</div>
                  <div className="mt-0.5 text-lg font-semibold text-cyan-200 tabular-nums">{stats.bySeverity.INFO}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                  <div className="text-[11px] text-zinc-500">WARN</div>
                  <div className="mt-0.5 text-lg font-semibold text-amber-200 tabular-nums">{stats.bySeverity.WARN}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                  <div className="text-[11px] text-zinc-500">CRITICAL</div>
                  <div className="mt-0.5 text-lg font-semibold text-fuchsia-200 tabular-nums">{stats.bySeverity.CRITICAL}</div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="border-b border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200">命中最多的规则</div>
                <div className="space-y-1 px-3 py-2">
                  {stats.topRules.length === 0 ? (
                    <div className="text-xs text-zinc-500">暂无告警</div>
                  ) : (
                    stats.topRules.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="min-w-0 truncate text-xs text-zinc-200">{name}</div>
                        <div className="shrink-0 text-xs text-zinc-400 tabular-nums">{count}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Tag tone="INFO">建议</Tag>
                  <span>如果“分歧”告警集中出现，优先观察梯队高度与容量承接，避免追涨一致。</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Tag tone="INFO">建议</Tag>
                  <span>如果“超预期”告警多且持续，优先看同概念的补涨扩散与资金连续性。</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader title="告警回放" subTitle="按时间倒序展示，等价于盘后快速复盘时间线" right={<Tag tone="INFO">{alerts.length} 条</Tag>} />
            <CardBody className="space-y-3">
              {alerts.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">暂无告警</div>
              ) : (
                <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {alerts.slice(0, 120).map((a) => (
                    <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm text-zinc-100">{a.title}</div>
                          <div className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                            {new Date(a.createdAt).toLocaleString()} · Tick {(a.payload as { tickId?: string } | undefined)?.tickId ?? "-"}
                          </div>
                        </div>
                        <Tag tone={a.severity}>{a.severity}</Tag>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                        <div className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                          <div className="text-zinc-500">目标</div>
                          <div className="truncate text-zinc-200">{String((a.payload.target as { name?: string } | undefined)?.name ?? "")}</div>
                        </div>
                        <div className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1">
                          <div className="text-zinc-500">规则</div>
                          <div className="truncate text-zinc-200">{String((a.payload.rule as { name?: string } | undefined)?.name ?? "")}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <FileText className="h-4 w-4 text-cyan-200" />
                    复盘笔记
                  </div>
                  <div className={cn("text-xs", saved ? "text-emerald-200" : "text-zinc-500")}>{saved ? "已保存（本地）" : "未保存"}</div>
                </div>
                <div className="px-3 py-2">
                  <textarea
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value)
                      setSaved(false)
                    }}
                    spellCheck={false}
                    placeholder="记录今日主线、分歧点、计划修正与明日观察位…"
                    className="h-[160px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500/40"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem("ai-trader.note.v1", note)
                          setSaved(true)
                        } catch {
                          //
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
