export type Severity = "INFO" | "WARN" | "CRITICAL"

export type TargetType = "stock" | "concept" | "industry" | "market"

export type Operand =
  | { kind: "field"; path: string }
  | { kind: "const"; value: number | string | boolean | null }

export type CompareOp =
  | ">"
  | ">="
  | "<"
  | "<="
  | "=="
  | "!="
  | "contains"
  | "in"
  | "startsWith"
  | "endsWith"

export type ConditionNode =
  | { type: "all"; children: ConditionNode[] }
  | { type: "any"; children: ConditionNode[] }
  | { type: "not"; child: ConditionNode }
  | {
      type: "compare"
      left: Operand
      op: CompareOp
      right: Operand
    }

export type Action =
  | {
      type: "createAlert"
      title: string
      severity?: Severity
      dedupeWindowMs?: number
      dedupeKeyTemplate?: string
      includePaths?: string[]
      tags?: string[]
    }

export type Rule = {
  id: string
  name: string
  enabled: boolean
  severity: Severity
  dslVersion: "1"
  target: {
    type: TargetType
  }
  condition: ConditionNode
  actions: Action[]
  createdAt: string
  updatedAt: string
}

export type Alert = {
  id: string
  ruleId: string
  severity: Severity
  title: string
  dedupeKey: string
  payload: Record<string, unknown>
  createdAt: string
}

export type EngineContext = {
  now: number
  tickId: string
  target: {
    type: TargetType
    id?: string
    name?: string
  }
  data: Record<string, unknown>
}

export type RuleEvaluationResult = {
  matched: boolean
  alerts: Alert[]
  evidence: Record<string, unknown>
}

