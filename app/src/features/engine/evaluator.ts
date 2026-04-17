import type { CompareOp, ConditionNode, EngineContext, Operand } from "./types"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function getByPath(root: unknown, path: string): unknown {
  if (!path) return undefined
  const parts = path.split(".").filter(Boolean)
  let cur: unknown = root
  for (const p of parts) {
    if (!isRecord(cur)) return undefined
    cur = cur[p]
  }
  return cur
}

function resolveOperand(op: Operand, ctx: EngineContext): unknown {
  if (op.kind === "const") return op.value
  if (op.path.startsWith("target.")) return getByPath(ctx.target, op.path.slice("target.".length))
  if (op.path.startsWith("data.")) return getByPath(ctx.data, op.path.slice("data.".length))
  return getByPath(ctx.data, op.path)
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function compare(op: CompareOp, left: unknown, right: unknown): boolean {
  switch (op) {
    case ">": {
      const l = toNumber(left)
      const r = toNumber(right)
      return l !== null && r !== null && l > r
    }
    case ">=": {
      const l = toNumber(left)
      const r = toNumber(right)
      return l !== null && r !== null && l >= r
    }
    case "<": {
      const l = toNumber(left)
      const r = toNumber(right)
      return l !== null && r !== null && l < r
    }
    case "<=": {
      const l = toNumber(left)
      const r = toNumber(right)
      return l !== null && r !== null && l <= r
    }
    case "==":
      return left === right
    case "!=":
      return left !== right
    case "contains": {
      if (typeof left === "string") return typeof right === "string" && left.includes(right)
      if (Array.isArray(left)) return left.includes(right as never)
      return false
    }
    case "in": {
      if (Array.isArray(right)) return right.includes(left as never)
      if (typeof right === "string") return typeof left === "string" && right.includes(left)
      return false
    }
    case "startsWith": {
      return typeof left === "string" && typeof right === "string" && left.startsWith(right)
    }
    case "endsWith": {
      return typeof left === "string" && typeof right === "string" && left.endsWith(right)
    }
    default:
      return false
  }
}

export function evaluateCondition(node: ConditionNode, ctx: EngineContext): { matched: boolean; evidence: Record<string, unknown> } {
  if (node.type === "all") {
    const evidence: Record<string, unknown> = { type: "all", children: [] as unknown[] }
    const childResults = node.children.map((c) => evaluateCondition(c, ctx))
    evidence.children = childResults.map((r) => r.evidence)
    return { matched: childResults.every((r) => r.matched), evidence }
  }
  if (node.type === "any") {
    const evidence: Record<string, unknown> = { type: "any", children: [] as unknown[] }
    const childResults = node.children.map((c) => evaluateCondition(c, ctx))
    evidence.children = childResults.map((r) => r.evidence)
    return { matched: childResults.some((r) => r.matched), evidence }
  }
  if (node.type === "not") {
    const child = evaluateCondition(node.child, ctx)
    return { matched: !child.matched, evidence: { type: "not", child: child.evidence } }
  }
  const left = resolveOperand(node.left, ctx)
  const right = resolveOperand(node.right, ctx)
  const matched = compare(node.op, left, right)
  return {
    matched,
    evidence: {
      type: "compare",
      left: node.left,
      op: node.op,
      right: node.right,
      leftValue: left,
      rightValue: right,
      matched,
    },
  }
}

