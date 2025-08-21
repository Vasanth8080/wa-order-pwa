import type { AppConfig, Role } from './types'

export const defaultConfig: AppConfig = {
  units: [unit('STL'), unit('SKS'), unit('DV')],
  templates: {
    loader: 'Load on {date}: {bags} bags — {customer} (Broker: {broker}) — Unit: {unit}',
    accountant: 'Billing {date} — {unit}: {bags} bags × ₹{rate}/bag — Customer: {customer} — Broker: {broker}',
    partner: 'Order ({unit}) — {date}: {bags} bags, Customer {customer}, Broker {broker}, Rate ₹{rate}/bag'
  },
  visibility: {
    loader: ['date','unit','bags','broker','customer'],
    accountant: ['date','unit','bags','broker','customer','rate'],
    partner: ['date','unit','bags','broker','customer','rate']
  }
}

function unit(id: string){
  return {
    id,
    name: id,
    recipients: { loader: [], accountant: [], partner: [] },
    templates: {
      loader: 'Load on {date}: {bags} bags — {customer} (Broker: {broker}) — Unit: {unit}',
      accountant: 'Billing {date} — {unit}: {bags} bags × ₹{rate}/bag — Customer: {customer} — Broker: {broker}',
      partner: 'Order ({unit}) — {date}: {bags} bags, Customer {customer}, Broker {broker}, Rate ₹{rate}/bag'
    },
    visibility: {
      loader: ['date','unit','bags','broker','customer'],
      accountant: ['date','unit','bags','broker','customer','rate'],
      partner: ['date','unit','bags','broker','customer','rate']
    }
  }
}

export function loadConfig(): AppConfig{
  const raw = localStorage.getItem('wa-router-config')
  if(!raw) return defaultConfig
  try { return JSON.parse(raw) as AppConfig } catch { return defaultConfig }
}

export function saveConfig(cfg: AppConfig){
  localStorage.setItem('wa-router-config', JSON.stringify(cfg))
}

export function applyTemplate(template: string, visible: string[], data: Record<string, any>){
  const safe = (k: string) => (visible.includes(k) ? (data[k] ?? '') : '')
  return template
    .replaceAll('{date}', safe('date'))
    .replaceAll('{unit}', safe('unit'))
    .replaceAll('{bags}', safe('bags'))
    .replaceAll('{broker}', safe('broker'))
    .replaceAll('{customer}', safe('customer'))
    .replaceAll('{rate}', safe('rate'))
    .trim()
}
