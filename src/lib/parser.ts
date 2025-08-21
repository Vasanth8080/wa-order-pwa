const UNIT_RE = /(STL|SKS|DV|FTL|9477|8677|7144|9499|1616|7827|1497)/i
const BAGS_RE = /(\d{1,4})\s*(bags?|bg|bag)\b/i
const RATE_RE = /(₹\s?(\d+(?:\.\d+)?)\s*(?:\/\s*bag)?|rate\s*(\d+(?:\.\d+)?))/i
const BROKER_RE = /\bbroker[:\-]?\s*([A-Za-z\s&.]+)/i
const CUSTOMER_RE = /(?:\bcustomer\b|\bto\b)[:\-\s]*([A-Za-z0-9\s&.]+)/i

function cleanupName(s: string){
  return s.replace(/\s+/g,' ').replace(/[^A-Za-z0-9&.\-\s]/g,'').trim()
}

function parseSimpleDate(text: string, today = new Date()): string | undefined {
  const lower = text.toLowerCase()
  const ddm = /(\b\d{1,2})[\/-.](\d{1,2})(?:[\/-.](\d{2,4}))?/
  const m = lower.match(ddm)
  if (m){
    const dd = parseInt(m[1],10)
    const mm = parseInt(m[2],10)
    const yyyy = m[3] ? parseInt(m[3],10) : today.getFullYear()
    const d = new Date(yyyy, mm-1, dd)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0,10)
  }
  if (/\btoday\b/.test(lower)) return new Date(today).toISOString().slice(0,10)
  if (/\btomorrow|tmrw|tmr\b/.test(lower)) {
    const d = new Date(today); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10)
  }
  const weekdays = ['sun','mon','tue','wed','thu','fri','sat']
  for (let i=0;i<weekdays.length;i++){
    const w = weekdays[i]
    if (new RegExp('\\b'+w+'(?:day)?\\b').test(lower)){
      const d = new Date(today)
      const delta = (i - d.getDay() + 7) % 7
      d.setDate(d.getDate()+delta)
      return d.toISOString().slice(0,10)
    }
  }
  return undefined
}

export function parseOrderCore(input: string, today = new Date()){
  const text = input.replace(/\n/g,' ').trim()
  const out: any = {}

  const unit = text.match(UNIT_RE)?.[1]
  if (unit) out.unit = unit.toUpperCase()

  const bags = text.match(BAGS_RE)?.[1]
  if (bags) out.bags = String(bags)

  const rateMatch = text.match(RATE_RE)
  if (rateMatch) out.rate = rateMatch[2] ?? rateMatch[3]

  const custM = CUSTOMER_RE.exec(text)
  if (custM) out.customer = cleanupName(custM[1])

  const broker = text.match(BROKER_RE)?.[1]?.trim()
  if (broker) out.broker = cleanupName(broker)

  const date = parseSimpleDate(text, today)
  if (date) out.date = date

  return out
}

export function parseOrder(input: string){
  return parseOrderCore(input)
}

export function parseOrders(input: string, today = new Date()){
  const text = input.replace(/\n/g,' ').trim()
  const re = new RegExp(UNIT_RE, 'gi')
  const matches = Array.from(text.matchAll(re))
  if (matches.length === 0) return [parseOrderCore(text, today)]

  const segments: { unit: string, text: string }[] = []
  for (let idx=0; idx<matches.length; idx++){
    const m = matches[idx]
    const start = m.index ?? 0
    const end = (idx+1 < matches.length) ? (matches[idx+1].index ?? text.length) : text.length
    const segText = text.slice(start, end)
    const unit = (m[1] ?? m[0]).toUpperCase()
    segments.push({ unit, text: segText })
  }

  const orders = segments.map(seg => {
    const o = parseOrderCore(seg.text, today)
    if (!o.unit) o.unit = seg.unit
    return o
  })

  return orders.filter(o => o.unit || o.bags || o.customer || o.broker || o.rate || o.date)
}
