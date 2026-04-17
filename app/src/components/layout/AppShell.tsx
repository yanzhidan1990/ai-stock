import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Activity, BookOpen, Gavel, LayoutDashboard } from "lucide-react"

type Item = {
  to: string
  label: string
  icon: React.ReactNode
}

const items: Item[] = [
  { to: "/", label: "盘中看板", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/rules", label: "规则中心", icon: <Gavel className="h-4 w-4" /> },
  { to: "/review", label: "复盘中心", icon: <BookOpen className="h-4 w-4" /> },
]

export function AppShell(props: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Activity className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-zinc-100">AI 概念操盘终端</div>
              <div className="text-xs text-zinc-400">规则引擎 · 告警聚合 · 复盘回放</div>
            </div>
          </div>
          <div className="flex items-center gap-3">{props.right}</div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100",
                  isActive && "bg-zinc-900 text-zinc-100",
                )
              }
              end={it.to === "/"}
            >
              {it.icon}
              <span>{it.label}</span>
            </NavLink>
          ))}
          <div className="ml-auto hidden items-center gap-2 pr-2 text-xs text-zinc-500 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span>模拟盘中流</span>
          </div>
        </div>

        <div className="mt-4">{props.children}</div>
      </div>
    </div>
  )
}

