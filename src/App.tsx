import { useEffect, useMemo, useState } from 'react'
import { applyTemplate, loadConfig, saveConfig } from './lib/config'
import { parseOrders, parseOrder } from './lib/parser'
import type { Role, UnitConfig, AppConfig } from './lib/types'
import { shareOrLink } from './lib/share'

const roles: Role[] = ['loader','accountant','partner']

export default function App() {
  const [tab, setTab] = useState<'home'|'settings'|'about'|'tests'>('home')
  const [raw, setRaw] = useState('STL 120 bags to Sri Lakshmi on 22/08 broker Mani — rate 1345, SKS 40 bags to Kumar Friday broker Arjun')
  const [config, setConfig] = useState(loadConfig())
  const orders = useMemo(() => parseOrders(raw), [raw])

  useEffect(() => { saveConfig(config) }, [config])

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <TopBar tab={tab} setTab={setTab} />
      <main className="max-w-5xl mx-auto p-4 grid gap-4">
        {tab === 'home' && (
          <>
            <Card>
              <h2 className="text-xl font-semibold mb-2">Paste or dictate order message</h2>
              <textarea value={raw} onChange={e=>setRaw(e.target.value)}
                className="w-full h-36 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., STL 50 bags to A, SKS 30 bags to B, broker Mani, rate 1320"/>
              <p className="text-sm text-slate-600 mt-2">
                Multiple units in one text are split into separate orders automatically. Weekday like “Friday” resolves to today if it is Friday.
              </p>
            </Card>

            {orders.map((parsed, idx) => (
              <Card key={idx}>
                <h3 className="font-semibold mb-3">Order {idx+1}{parsed.unit?` — ${parsed.unit}`:''}</h3>
                <FieldGrid parsed={parsed} onChange={(p)=>Object.assign(parsed, p)} />
                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  {roles.map((role)=> (
                    <RoleSend key={role} role={role} parsed={parsed} config={config} />
                  ))}
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === 'settings' && <Settings config={config} setConfig={setConfig} />}

        {tab === 'tests' && <ParserTests />}

        {tab === 'about' && (
          <Card>
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-slate-700">Creates separate messages per unit; weekday names resolve to today when applicable.</p>
          </Card>
        )}
      </main>
    </div>
  )
}

function TopBar({tab,setTab}:{tab:'home'|'settings'|'about'|'tests',setTab:(t:any)=>void}){
  return (
    <header className="sticky top-0 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="font-semibold">WA Order Router</div>
        <nav className="ml-auto flex gap-2">
          <NavBtn active={tab==='home'} onClick={()=>setTab('home')}>Home</NavBtn>
          <NavBtn active={tab==='settings'} onClick={()=>setTab('settings')}>Settings</NavBtn>
          <NavBtn active={tab==='tests'} onClick={()=>setTab('tests')}>Tests</NavBtn>
          <NavBtn active={tab==='about'} onClick={()=>setTab('about')}>About</NavBtn>
        </nav>
      </div>
    </header>
  )
}

function NavBtn({active, children, ...props}: any){
  return (
    <button className={"px-3 py-1.5 rounded-xl border "+(active?"bg-emerald-600 text-white border-emerald-600":"bg-white border-slate-200 hover:border-slate-300")} {...props}>{children}</button>
  )
}

function Card({children}:{children: any}){
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4">{children}</div>
}

function FieldGrid({parsed,onChange}:{parsed:any,onChange:(p:any)=>void}){
  const [state, setState] = useState(parsed)
  useEffect(()=>{ setState(parsed) },[parsed])
  useEffect(()=>{ onChange(state) },[state])
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {['unit','date','bags','broker','customer','rate'].map((k)=> (
        <label key={k} className="grid gap-1">
          <span className="text-sm text-slate-600 capitalize">{k}</span>
          <input
            value={state[k] ?? ''}
            onChange={e=>setState((s:any)=>({...s,[k]: (e.target as HTMLInputElement).value}))}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={k==='date'? 'YYYY-MM-DD' : ''}
          />
        </label>
      ))}
    </div>
  )
}

function RoleSend({role, parsed, config}:{role:Role, parsed:any, config:AppConfig}){
  const units = config.units
  const [unitId, setUnitId] = useState(parsed.unit || units[0]?.id || '')
  useEffect(()=>{ if(parsed.unit && units.find(u=>u.id===parsed.unit)) setUnitId(parsed.unit) },[parsed.unit])

  const unit = units.find(u=>u.id===unitId)
  const template = unit?.templates[role] ?? config.templates[role]
  const visibility = unit?.visibility?.[role] ?? config.visibility[role]
  const msg = applyTemplate(template, visibility, parsed)
  const recipients = unit?.recipients?.[role] ?? []

  return (
    <div className="border rounded-xl p-3 border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold capitalize">{role}</div>
        <select value={unitId} onChange={e=>setUnitId(e.target.value)} className="px-2 py-1 border rounded-lg">
          {units.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <textarea className="w-full h-28 text-sm p-2 border rounded-lg" readOnly value={msg} />
      <div className="flex flex-wrap gap-2 mt-2">
        {recipients.length>0 ? (
          recipients.map((r,idx)=> (
            <button key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white" onClick={()=>navigator.clipboard?.writeText(msg)}>
              Copy for {r.name}
            </button>
          ))
        ) : (
          <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white" onClick={()=>navigator.clipboard?.writeText(msg)}>
            Copy message
          </button>
        )}
        <button className="px-3 py-1.5 rounded-xl border" onClick={()=>shareOrLink(msg)}>
          Open in WhatsApp
        </button>
      </div>
    </div>
  )
}

function Settings({config, setConfig}:{config: AppConfig, setConfig:(c:AppConfig)=>void}){
  const [units, setUnits] = useState(config.units)
  const [newUnit, setNewUnit] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(()=>{ setConfig({...config, units}) },[units])

  const active = units[activeIdx]
  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-xl font-semibold mb-3">Units</h2>
        <div className="flex gap-2 mb-3">
          <input value={newUnit} onChange={e=>setNewUnit(e.target.value)} placeholder="Add Unit ID (e.g., STL)" className="px-3 py-2 border rounded-xl"/>
          <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white" onClick={()=>{
            const id = newUnit.trim().toUpperCase(); if(!id) return
            if(units.find(u=>u.id===id)) return
            setUnits([...units, {
              id, name: id,
              recipients: { loader:[], accountant:[], partner:[] },
              templates: config.templates,
              visibility: config.visibility,
            }])
            setNewUnit('')
            setActiveIdx(units.length)
          }}>Add Unit</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {units.map((u,i)=> (
            <button key={u.id} onClick={()=>setActiveIdx(i)} className={`px-3 py-1.5 rounded-xl border ${i===activeIdx? 'bg-emerald-600 text-white border-emerald-600':'bg-white border-slate-200'}`}>{u.name}</button>
          ))}
        </div>
      </Card>

      {active && (
        <Card>
          <h3 className="font-semibold mb-2">Recipients for {active.name}</h3>
          {(['loader','accountant','partner'] as Role[]).map((role)=> (
            <RoleRecipients key={role} role={role} units={units} setUnits={setUnits} idx={activeIdx}/>
          ))}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-2">Templates (defaults)</h3>
        {(['loader','accountant','partner'] as Role[]).map((role)=> (
          <TemplateRow key={role} role={role} config={config} setConfig={setConfig} />
        ))}
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">Backup / Restore</h3>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={()=>{
            const blob = new Blob([JSON.stringify(config,null,2)], {type:'application/json'})
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'wa-router-config.json'; a.click()
            URL.revokeObjectURL(url)
          }}>Download Config</button>
          <label className="px-3 py-2 rounded-xl border cursor-pointer">
            <input type="file" accept="application/json" className="hidden" onChange={async(e)=>{
              const f = e.target.files?.[0]; if(!f) return
              const txt = await f.text()
              try { const obj = JSON.parse(txt); setConfig(obj) } catch {}
            }}/>
            Upload Config
          </label>
        </div>
      </Card>
    </div>
  )
}

function RoleRecipients({role, units, setUnits, idx}:{role:Role, units:UnitConfig[], setUnits:(u:UnitConfig[])=>void, idx:number}){
  const u = units[idx]
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const add = ()=>{
    const p = phone.trim()
    const n = name.trim()
    const next = [...units]
    next[idx] = {
      ...u,
      recipients: { ...u.recipients, [role]: [...u.recipients[role], { name: n || 'Recipient', phone: p || undefined }] }
    }
    setUnits(next)
    setName(''); setPhone('')
  }

  const remove = (i:number)=>{
    const next = [...units]
    next[idx] = {
      ...u,
      recipients: { ...u.recipients, [role]: u.recipients[role].filter((_,k)=>k!==i) }
    }
    setUnits(next)
  }

  return (
    <div className="mb-4">
      <div className="text-sm text-slate-600 capitalize mb-1">{role} recipients</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {u.recipients[role].map((r,i)=> (
          <span key={i} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 text-sm">
            {r.name}{r.phone?` (${r.phone})`:''}
            <button className="text-red-600" onClick={()=>remove(i)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="px-3 py-2 border rounded-xl"/>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (optional, e.g., 91XXXXXXXXXX)" className="px-3 py-2 border rounded-xl"/>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">Add</button>
      </div>
      <p className="text-xs text-slate-500 mt-1">If phone is empty, use copy/share to pick a WhatsApp contact/group.</p>
    </div>
  )
}

function TemplateRow({role, config, setConfig}:{role:Role, config:AppConfig, setConfig:(c:AppConfig)=>void}){
  const [tpl, setTpl] = useState(config.templates[role])
  useEffect(()=>{ setTpl(config.templates[role]) },[config])
  const save = ()=> setConfig({...config, templates: {...config.templates, [role]: tpl }})
  return (
    <div className="mb-3">
      <div className="text-sm font-medium capitalize">{role}</div>
      <textarea value={tpl} onChange={e=>setTpl(e.target.value)} className="w-full h-20 p-2 border rounded-lg text-sm"/>
      <button onClick={save} className="mt-1 px-3 py-1.5 rounded-xl border">Save Template</button>
      <div className="text-xs text-slate-500 mt-1">Tokens: {'{date} {unit} {bags} {broker} {customer} {rate}'}</div>
    </div>
  )
}

function ParserTests(){
  const [results, setResults] = useState<{name:string, pass:boolean, got:any}[]>([])
  const run = ()=>{
    const tests = [
      { name: 'Baseline with all fields', input: 'STL 120 bags to Sri Lakshmi on 22/08 broker Mani — rate 1345', expect: { unit:'STL', bags:'120', rate:'1345' } },
      { name: 'Loader order without rate', input: 'SKS 200 bg to Kumar Friday broker Arjun', expect: { unit:'SKS', bags:'200' } },
      { name: 'Different unit + dd-mm date', input: 'DV 75 bag customer Mohan on 21-08 rate 1299 broker K', expect: { unit:'DV', bags:'75', rate:'1299' } },
      { name: 'Handles today keyword', input: 'STL 10 bags customer ABC today broker XYZ', expect: { unit:'STL', bags:'10' } },
      { name: 'Multi-unit splits', input: 'STL 50 bags to A broker M, SKS 30 bags to B broker N, rate 1200', expect: [ {unit:'STL', bags:'50'}, {unit:'SKS', bags:'30'} ] },
    ]
    const res = tests.map((t) => {
      const multi = parseOrders(t.input)
      const exp = t.expect as any
      let pass: boolean
      if (Array.isArray(exp)){
        pass = exp.length === multi.length && exp.every((e,i)=> Object.entries(e).every(([k,v]) => String((multi[i] as any)[k]) === String(v)))
      } else {
        const got = parseOrder(t.input)
        pass = Object.entries(exp).every(([k,v]) => String((got as any)[k]) === String(v))
      }
      return { name: t.name, pass, got: Array.isArray(exp) ? multi : parseOrder(t.input) }
    })
    setResults(res)
  }
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-2">Parser tests</h2>
      <p className="text-slate-700">Click “Run tests” to check parser behavior (including multi-unit splitting and weekday=today).</p>
      <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white" onClick={run}>Run tests</button>
      <div className="grid gap-2 mt-3">
        {results.map((r,i)=>(
          <div key={i} className="border rounded-xl p-2 border-slate-200">
            <div className="font-semibold">{r.pass ? '✅ PASS' : '❌ FAIL'} — {r.name}</div>
            <pre className="text-xs whitespace-pre-wrap m-0 mt-1">{JSON.stringify(r.got, null, 2)}</pre>
          </div>
        ))}
      </div>
    </Card>
  )
}
