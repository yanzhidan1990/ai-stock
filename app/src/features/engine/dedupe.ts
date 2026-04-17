type DeduperState = {
  lastFiredAt: number
}

export class AlertDeduper {
  private readonly map = new Map<string, DeduperState>()

  shouldEmit(dedupeKey: string, now: number, windowMs: number): boolean {
    const prev = this.map.get(dedupeKey)
    if (!prev) {
      this.map.set(dedupeKey, { lastFiredAt: now })
      return true
    }
    if (now - prev.lastFiredAt >= windowMs) {
      prev.lastFiredAt = now
      return true
    }
    return false
  }
}

