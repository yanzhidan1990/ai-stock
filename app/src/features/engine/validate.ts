import type { ConditionNode, Rule } from "./types"

function validateCondition(node: ConditionNode, errors: string[], path: string): void {
  if (node.type === "all" || node.type === "any") {
    if (!Array.isArray(node.children) || node.children.length === 0) errors.push(`${path}.children 不能为空`)
    node.children.forEach((c, i) => validateCondition(c, errors, `${path}.children[${i}]`))
    return
  }
  if (node.type === "not") {
    validateCondition(node.child, errors, `${path}.child`)
    return
  }
  if (node.type === "compare") {
    if (!node.left) errors.push(`${path}.left 缺失`)
    if (!node.right) errors.push(`${path}.right 缺失`)
    if (!node.op) errors.push(`${path}.op 缺失`)
    return
  }
  errors.push(`${path} 未知条件类型`)
}

export function validateRule(rule: Rule): string[] {
  const errors: string[] = []
  if (!rule.id) errors.push("id 不能为空")
  if (!rule.name) errors.push("name 不能为空")
  if (!rule.dslVersion) errors.push("dslVersion 不能为空")
  if (!rule.target?.type) errors.push("target.type 不能为空")
  if (!rule.actions || rule.actions.length === 0) errors.push("actions 不能为空")
  if (!rule.condition) errors.push("condition 不能为空")
  else validateCondition(rule.condition, errors, "condition")
  return errors
}

