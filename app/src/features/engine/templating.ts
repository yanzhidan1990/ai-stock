function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function renderTemplate(template: string, vars: Record<string, string | number | boolean | null | undefined>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(escapeRegExp(`{{${k}}}`), "g")
    out = out.replace(re, String(v ?? ""))
  }
  return out
}

