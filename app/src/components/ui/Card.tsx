import { cn } from "@/lib/utils"

export function Card(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950/60", props.className)}>{props.children}</div>
}

export function CardHeader(props: { className?: string; title: string; right?: React.ReactNode; subTitle?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3", props.className)}>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-100">{props.title}</div>
        {props.subTitle ? <div className="mt-0.5 text-xs text-zinc-500">{props.subTitle}</div> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  )
}

export function CardBody(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-4 py-3", props.className)}>{props.children}</div>
}

