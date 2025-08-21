export type Role = 'loader' | 'accountant' | 'partner'

export type Recipient = { name: string; phone?: string }

export type UnitConfig = {
  id: string
  name: string
  recipients: Record<Role, Recipient[]>
  templates: Record<Role, string>
  visibility: Record<Role, string[]>
}

export type AppConfig = {
  units: UnitConfig[]
  templates: Record<Role, string>
  visibility: Record<Role, string[]>
}
