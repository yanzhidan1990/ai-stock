import { cn } from "@/lib/utils"

const palette = {
  INFO: "bg-cyan-500/10 text-cyan-200 ring-cyan-500/20",
  WARN: "bg-amber-500/10 text-amber-200 ring-amber-500/20",
  CRITICAL: "bg-fuchsia-500/10 text-fuchsia-200 ring-fuchsia-500/20",
} as const

export function Tag(props: { tone: keyof typeof palette; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        palette[props.tone],
        props.className,
      )}
    >
      {props.children}
    </span>
  )
}

