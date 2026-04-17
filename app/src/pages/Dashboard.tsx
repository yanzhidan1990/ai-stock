import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Tag } from "@/components/ui/Tag"
import { useAppStore } from "@/features/store/appStore"
import { getSimRunnerState, resetSim, startSim, stepSim } from "@/features/store/simRunner"
import { getSimUniverse } from "@/features/data/sim/generator"
import type { SimTick, StockSnapshot } from "@/features/data/sim/types"
import { cn } from "@/lib/utils"
import { CirclePlay, CornerDownLeft, RotateCcw, Trash2 } from "lucide-react"

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

function TonePct(props: { value: number }) {
  const tone =
    props.value >= 3 ? "text-fuchsia-200" : props.value >= 1 ? "text-cyan-200" : props.value <= -2 ? "text-amber-200" : "text-zinc-200"
  return <span className={cn("tabular-nums", tone)}>{fmtPct(props.value)}</span>
}

function DividerRow() {
  return <div className="my-2 h-px bg-zinc-800" />
}

export default function Dashboard() {
  const { alerts, clearAlerts, rules, selectedConceptId, setSelectedConceptId, selectedStockId, setSelectedStockId } = useAppStore()
  const [running, setRunning] = useState(false)
  const [lastTick, setLastTick] = useState<SimTick | null>(null)

  useEffect(() => {
    const { lastTick: lt } = getSimRunnerState()
    if (lt) setLastTick(lt)
  }, [])

  useEffect(() => {
    if (!running) return
    const stop = startSim({ intervalMs: 3500 })
    return () => stop()
  }, [running])

  const universe = useMemo(() => getSimUniverse(), [])
  const conceptNameById = useMemo(() => new Map(universe.concepts.map((c) => [c.id, c.name])), [universe.concepts])

  const concepts = lastTick?.concepts ?? []
  const stocks = lastTick?.stocks ?? []

  const selectedConceptStocks = useMemo(() => {
    if (!selectedConceptId) return stocks
    return stocks.filter((s) => s.concept.id === selectedConceptId)
  }, [stocks, selectedConceptId])

  const tiers = useMemo(() => {
    const groups = new Map<string, StockSnapshot[]>()
    for (const s of selectedConceptStocks) {
      const key = s.stock.tier
      const prev = groups.get(key) ?? []
      prev.push(s)
      groups.set(key, prev)
    }
    for (const v of groups.values()) v.sort((a, b) => b.metrics.changePct - a.metrics.changePct)
    return Array.from(groups.entries())
  }, [selectedConceptStocks])

  const selectedStock = useMemo(() => {
    if (!selectedStockId) return null
    return stocks.find((s) => s.stock.id === selectedStockId) ?? null
  }, [stocks, selectedStockId])

  const topAlerts = alerts.slice(0, 30)
  const enabledRuleCount = rules.filter((r) => r.enabled).length

  return (
    <AppShell
      right={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const { tick } = stepSim()
              setLastTick(tick)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
          >
            <CornerDownLeft className="h-4 w-4 text-cyan-200" />
            单步
          </button>
          <button
            type="button"
            onClick={() => setRunning((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-zinc-100 transition",
              running ? "border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/15" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800",
            )}
          >
            <CirclePlay className={cn("h-4 w-4", running ? "text-fuchsia-200" : "text-cyan-200")} />
            {running ? "运行中" : "运行"}
          </button>
          <button
            type="button"
            onClick={() => {
              resetSim()
              setLastTick(null)
              setSelectedConceptId(null)
              setSelectedStockId(null)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4 text-zinc-200" />
            重置
          </button>
          <button
            type="button"
            onClick={() => clearAlerts()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-800"
          >
            <Trash2 className="h-4 w-4 text-amber-200" />
            清空告警
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader title="概念热度榜" subTitle={lastTick ? `最新 Tick：${lastTick.tickId}` : "点击“单步/运行”生成模拟盘中数据"} right={<Tag tone="INFO">启用规则 {enabledRuleCount}</Tag>} />
            <CardBody className="space-y-2">
              {concepts.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">暂无数据</div>
              ) : (
                <div className="space-y-1">
                  {concepts
                    .slice()
                    .sort((a, b) => b.metrics.changePct - a.metrics.changePct)
                    .map((c) => (
                      <button
                        key={c.concept.id}
                        type="button"
                        onClick={() => {
                          setSelectedConceptId(c.concept.id)
                          setSelectedStockId(null)
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                          selectedConceptId === c.concept.id ? "border-cyan-500/30 bg-cyan-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-zinc-100">{c.concept.name}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                            <span className="tabular-nums">涨停 {c.metrics.limitUpCount}</span>
                            <span className="tabular-nums">炸板率 {(c.metrics.failRate * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold">
                            <TonePct value={c.metrics.changePct} />
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            <span className="tabular-nums">{(c.metrics.moneyInflow / 1_000_000).toFixed(0)}M</span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              {selectedConceptId ? (
                <>
                  <DividerRow />
                  <button
                    type="button"
                    onClick={() => setSelectedConceptId(null)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900"
                  >
                    清除概念筛选
                  </button>
                </>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader
              title="梯队视图"
              subTitle={selectedConceptId ? `当前概念：${conceptNameById.get(selectedConceptId) ?? selectedConceptId}` : "未筛选概念，展示全部个股"}
              right={<Tag tone="INFO">可点击个股</Tag>}
            />
            <CardBody className="space-y-3">
              {tiers.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">暂无数据</div>
              ) : (
                tiers.map(([tier, list]) => (
                  <div key={tier} className="rounded-lg border border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                      <div className="text-xs font-semibold text-zinc-200">{tier}</div>
                      <div className="text-xs text-zinc-500 tabular-nums">{list.length} 只</div>
                    </div>
                    <div className="max-h-[260px] overflow-auto">
                      {list.map((s) => (
                        <button
                          key={s.stock.id}
                          type="button"
                          onClick={() => setSelectedStockId(s.stock.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 border-b border-zinc-900 px-3 py-2 text-left text-sm transition last:border-b-0 hover:bg-zinc-900",
                            selectedStockId === s.stock.id && "bg-fuchsia-500/10",
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-zinc-100">
                              {s.stock.name} <span className="text-xs text-zinc-500">{s.stock.code}</span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{s.concept.name}</div>
                          </div>
                          <div className="shrink-0 text-right text-xs">
                            <div className="text-sm font-semibold">
                              <TonePct value={s.metrics.changePct} />
                            </div>
                            <div className="mt-0.5 flex items-center justify-end gap-2 text-[11px] text-zinc-500">
                              <span className="tabular-nums">量比 {s.metrics.volumeRatio.toFixed(2)}</span>
                              <span className="tabular-nums">强度 {s.metrics.relStrengthConcept.toFixed(2)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-4">
            <Card>
              <CardHeader title="告警流" subTitle="规则触发会在此聚合（含去重）" right={<Tag tone={topAlerts[0]?.severity ?? "INFO"}>{topAlerts[0]?.severity ?? "INFO"}</Tag>} />
              <CardBody className="space-y-2">
                {topAlerts.length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">暂无告警</div>
                ) : (
                  <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                    {topAlerts.map((a) => (
                      <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm text-zinc-100">{a.title}</div>
                            <div className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">{new Date(a.createdAt).toLocaleTimeString()}</div>
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
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="个股快照" subTitle={selectedStock ? "展示关键字段（MVP）" : "选择左侧个股"} />
              <CardBody>
                {!selectedStock ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">未选择个股</div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <div className="text-sm font-semibold text-zinc-100">
                        {selectedStock.stock.name} <span className="text-xs text-zinc-500">{selectedStock.stock.code}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{selectedStock.concept.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">涨跌</div>
                        <div className="mt-0.5 text-sm font-semibold">
                          <TonePct value={selectedStock.metrics.changePct} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">量比</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStock.metrics.volumeRatio.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">相对强度</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStock.metrics.relStrengthConcept.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">回撤</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStock.metrics.pullbackPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

