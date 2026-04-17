import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Tag } from "@/components/ui/Tag"
import { useAppStore } from "@/features/store/appStore"
import { getRealRunnerState, stopReal, startReal, stepReal } from "@/features/data/realRunner"
import StockSearch from "@/components/StockSearch"
import { cn } from "@/lib/utils"
import { CirclePlay, CornerDownLeft, RotateCcw, Trash2, X } from "lucide-react"

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
  const { alerts, clearAlerts, rules, selectedStockId, setSelectedStockId, selectedStocks, removeStock } = useAppStore()
  const [running, setRunning] = useState(false)
  const [lastQuotes, setLastQuotes] = useState<any[] | null>(null)
  const [seq, setSeq] = useState(0)

  useEffect(() => {
    const { lastQuotes: lq, seq: sq } = getRealRunnerState()
    if (lq) {
      setLastQuotes(lq)
      setSeq(sq)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const stop = startReal({ intervalMs: 3500 })
    
    const id = window.setInterval(() => {
      const state = getRealRunnerState()
      setLastQuotes(state.lastQuotes)
      setSeq(state.seq)
    }, 1000)
    
    return () => {
      stop()
      window.clearInterval(id)
    }
  }, [running])

  const quotesMap = useMemo(() => {
    const m = new Map<string, any>()
    if (!lastQuotes) return m
    for (const q of lastQuotes) m.set(q.fullCode, q)
    return m
  }, [lastQuotes])

  const selectedStockData = useMemo(() => {
    if (!selectedStockId) return null
    return quotesMap.get(selectedStockId) ?? null
  }, [quotesMap, selectedStockId])

  const topAlerts = alerts.slice(0, 30)
  const enabledRuleCount = rules.filter((r) => r.enabled).length

  return (
    <AppShell
      right={
        <div className="flex items-center gap-2">
          <StockSearch />
          <button
            type="button"
            onClick={async () => {
              const { quotes } = await stepReal()
              setLastQuotes(quotes)
              setSeq(s => s + 1)
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
            {running ? "轮询中" : "开始轮询"}
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
        <div className="lg:col-span-9">
          <Card>
            <CardHeader
              title="自选股票池"
              subTitle={lastQuotes ? `最新数据轮次：${seq}` : "添加股票后点击单步或开始轮询"}
              right={<Tag tone="INFO">已选 {selectedStocks.length} 只</Tag>}
            />
            <CardBody className="space-y-3">
              {selectedStocks.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-8 text-center text-sm text-zinc-500">
                  股票池为空，请在右上角搜索添加 A股/港股/美股
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                    <div className="text-xs font-semibold text-zinc-200">代码/名称</div>
                    <div className="text-xs text-zinc-500">操作</div>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    {selectedStocks.map((s) => {
                      const q = quotesMap.get(s.fullCode)
                      return (
                        <button
                          key={s.fullCode}
                          type="button"
                          onClick={() => setSelectedStockId(s.fullCode)}
                          className={cn(
                            "group flex w-full items-center justify-between gap-3 border-b border-zinc-900 px-3 py-2 text-left text-sm transition last:border-b-0 hover:bg-zinc-900",
                            selectedStockId === s.fullCode && "bg-fuchsia-500/10",
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-zinc-100">
                              {s.name} <span className="text-xs text-zinc-500">{s.code}</span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{s.market.toUpperCase()}</div>
                          </div>
                          
                          {q ? (
                            <div className="shrink-0 text-right text-xs flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  <TonePct value={q.changePct} />
                                </div>
                                <div className="mt-0.5 flex items-center justify-end gap-2 text-[11px] text-zinc-500">
                                  <span className="tabular-nums">价格 {q.price.toFixed(2)}</span>
                                  <span className="tabular-nums">换手 {q.turnoverRate.toFixed(2)}%</span>
                                </div>
                              </div>
                              <div 
                                className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeStock(s.fullCode)
                                }}
                              >
                                <X className="h-4 w-4" />
                              </div>
                            </div>
                          ) : (
                            <div className="shrink-0 flex items-center gap-4">
                              <div className="text-xs text-zinc-600">等待数据...</div>
                              <div 
                                className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeStock(s.fullCode)
                                }}
                              >
                                <X className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
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
                  <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
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
              <CardHeader title="个股快照" subTitle={selectedStockData ? "展示最新真实行情" : "选择左侧个股"} />
              <CardBody>
                {!selectedStockData ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">未选择个股或无数据</div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <div className="text-sm font-semibold text-zinc-100">
                        {selectedStockData.name} <span className="text-xs text-zinc-500">{selectedStockData.fullCode}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">最新价：{selectedStockData.price.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">涨跌幅</div>
                        <div className="mt-0.5 text-sm font-semibold">
                          <TonePct value={selectedStockData.changePct} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">量比</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStockData.volumeRatio.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">换手率</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStockData.turnoverRate.toFixed(2)}%</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="text-[11px] text-zinc-500">振幅</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStockData.amplitude.toFixed(2)}%</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 col-span-2">
                        <div className="text-[11px] text-zinc-500">成交额（万）</div>
                        <div className="mt-0.5 text-sm font-semibold text-zinc-100 tabular-nums">{selectedStockData.volumeMoney.toFixed(2)}</div>
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

