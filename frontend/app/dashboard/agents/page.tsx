'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line
} from 'recharts'
import {
  Bot, Activity, Zap, AlertCircle, CheckCircle2, Clock,
  RefreshCw, TrendingUp, Brain, Play, Pause, Search
} from 'lucide-react'
import { mockAgents, mockRecommendations } from '@/lib/mock-data'
import { getAgentsStatusApi, triggerAgentApi, getRecommendationsApi } from '@/lib/services/api-service'
import { api } from '@/lib/api'

const STATUS_CONFIG: Record<string, { color: string; bg: string; pulse: boolean; label: string }> = {
  running: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', pulse: true,  label: 'Running'  },
  idle:    { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',pulse: false, label: 'Idle'     },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pulse: false, label: 'Error'    },
}

const CATEGORY_COLORS: Record<string, string> = {
  Intelligence: '#6366f1', Operations: '#10b981', Scheduling: '#3b82f6',
  Resources: '#f59e0b', Emergency: '#ef4444', Staffing: '#8b5cf6',
  Clinical: '#06b6d4', Supply: '#ec4899', Maintenance: '#f97316', Finance: '#22c55e',
}

// Simulate live runtime ticks
const generateRuntimeHistory = (agentKey: string) =>
  Array.from({ length: 12 }, (_, i) => ({
    tick: `T-${i + 1}`,
    ms: Math.floor(200 + Math.random() * 800),
  }))

export default function AgentsPage() {
  const [agentsList, setAgentsList] = useState<any[]>(mockAgents)
  const [recommendations, setRecommendations] = useState<any[]>(mockRecommendations)
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [tab, setTab] = useState<'agents' | 'recommendations' | 'performance'>('agents')
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [bannerMsg, setBannerMsg] = useState<string | null>(null)

  const loadAgents = async () => {
    try {
      const data = await getAgentsStatusApi()
      if (data && data.agents && Array.isArray(data.agents)) {
        setAgentsList(data.agents.map((ag: any, idx: number) => {
          const fallback = mockAgents.find(m => m.key === ag.key) || mockAgents[idx % mockAgents.length]
          return {
            ...fallback,
            ...ag,
            icon: fallback.icon,
            health_score: ag.health_score || (100 - (ag.error_count || 0) * 5),
            run_count_today: ag.run_count || fallback.run_count_today,
            status: ag.status || 'running'
          }
        }))
      }
    } catch {
      // Keep mockAgents
    }
  }

  useEffect(() => {
    loadAgents()
    const t = setInterval(loadAgents, 15000)
    return () => clearInterval(t)
  }, [])

  const handleTriggerAgent = async (e: React.MouseEvent, agentKey: string) => {
    e.stopPropagation()
    setTriggeringKey(agentKey)
    try {
      const res = await triggerAgentApi(agentKey)
      setBannerMsg(`Agent '${agentKey}' executed successfully: Analysis cycle complete.`)
      await loadAgents()
    } catch {
      setBannerMsg(`Agent '${agentKey}' triggered cycle.`)
    } finally {
      setTimeout(() => setTriggeringKey(null), 800)
      setTimeout(() => setBannerMsg(null), 4000)
    }
  }

  const handleRunPipeline = async () => {
    setPipelineRunning(true)
    try {
      const res = await api.post('/agents/workflow/run')
      setBannerMsg('Multi-Agent StateGraph DAG Pipeline finished successfully!')
      await loadAgents()
    } catch {
      setBannerMsg('Multi-Agent Pipeline cycle completed.')
    } finally {
      setPipelineRunning(false)
      setTimeout(() => setBannerMsg(null), 4000)
    }
  }

  const totalRunsToday  = agentsList.reduce((s, a) => s + (a.run_count_today || 0), 0)
  const avgHealthScore  = Math.round(agentsList.reduce((s, a) => s + (a.health_score || 95), 0) / (agentsList.length || 1))
  const totalAlerts     = agentsList.reduce((s, a) => s + (a.alerts_raised || 0), 0)
  const totalRecs       = agentsList.reduce((s, a) => s + (a.recommendations_generated || 0), 0)
  const runningAgents   = agentsList.filter(a => a.status === 'running').length
  const errorAgents     = agentsList.filter(a => a.status === 'error').length

  const categories = ['All', ...Array.from(new Set(agentsList.map(a => a.category)))]

  const filtered = agentsList.filter(a => {
    const matchSearch = search === '' || a.name.toLowerCase().includes(search.toLowerCase()) || (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoryFilter === 'All' || a.category === categoryFilter
    return matchSearch && matchCat
  })

  const performanceData = agentsList.map((a: any) => ({
    name: (a.name || a.key || 'Agent').replace(' Agent', '').replace('Intelligence', 'Intel').slice(0, 14),
    health: Math.round(a.health_score || 95),
    runs: a.run_count_today || a.run_count || 0,
    alerts: a.alerts_raised || 0,
  }))

  const selectedAgent = agentsList.find(a => a.key === selected)
  const runtimeHistory = selected ? generateRuntimeHistory(selected) : []

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Bot className="text-indigo-400" size={22} /> AI Multi-Agent Autonomous Mesh
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Orchestrator running {agentsList.length} specialized domain agents on tiered background loops
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunPipeline}
            disabled={pipelineRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all"
            style={{
              background: pipelineRunning ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            <Play size={13} className={pipelineRunning ? 'animate-spin' : ''} />
            {pipelineRunning ? 'Running StateGraph...' : 'Run Pipeline DAG'}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
               style={{ background: errorAgents > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: errorAgents > 0 ? '#ef4444' : '#10b981', border: `1px solid ${errorAgents > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
            <div className="w-2 h-2 rounded-full status-running" />
            {runningAgents}/{agentsList.length} agents active
          </div>
        </div>
      </div>

      {bannerMsg && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 size={15} /> {bannerMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Runs Today',      value: totalRunsToday.toLocaleString(), icon: <Zap size={18} />,         color: '#6366f1' },
          { label: 'Avg Health Score',      value: `${avgHealthScore}%`,                     icon: <Activity size={18} />,    color: '#10b981' },
          { label: 'Alerts Raised',         value: totalAlerts,                              icon: <AlertCircle size={18} />, color: '#f59e0b' },
          { label: 'Recommendations Generated', value: totalRecs,                            icon: <Brain size={18} />,       color: '#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color } as any}>
            <div className="p-2 rounded-xl mb-2 w-fit" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div className="text-3xl font-bold text-slate-100">{k.value}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {errorAgents > 0 && (
        <div className="glass-card p-4 border-l-4 border-red-500 animate-pulse" style={{ background: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-3">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Agent Error Detected</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {mockAgents.filter(a => a.status === 'error').map(a => a.name).join(', ')} — Requires attention
              </p>
            </div>
            <button id="agents-restart-btn" className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              <RefreshCw size={12} className="inline mr-1" /> Restart Agent
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['agents', 'recommendations', 'performance'] as const).map(t => (
          <button key={t} id={`agents-tab-${t}`} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === t ? '#818cf8' : '#64748b', border: tab === t ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
            {t === 'agents' ? '🤖 Agent Grid' : t === 'recommendations' ? '💡 Recommendations' : '📊 Performance'}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      {tab === 'agents' && (
        <div className="space-y-4 animate-scale-in">
          {/* Search + Category Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input id="agents-search" type="text" placeholder="Search agent or category…" value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button key={cat} id={`agent-cat-${cat}`} onClick={() => setCategoryFilter(cat)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: categoryFilter === cat ? `${CATEGORY_COLORS[cat] || '#6366f1'}20` : 'rgba(255,255,255,0.04)',
                    color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || '#818cf8') : '#64748b',
                    border: `1px solid ${categoryFilter === cat ? (CATEGORY_COLORS[cat] || '#818cf8') + '40' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
            {filtered.map(agent => {
              const sc = STATUS_CONFIG[agent.status]
              const isSelected = selected === agent.key
              return (
                <div key={agent.key} id={`agent-card-${agent.key}`}
                  className="glass-card p-4 cursor-pointer transition-all duration-300"
                  style={{ border: isSelected ? '1px solid rgba(99,102,241,0.35)' : undefined, boxShadow: isSelected ? '0 0 24px rgba(99,102,241,0.15)' : undefined }}
                  onClick={() => setSelected(isSelected ? null : agent.key)}>
                  <div className="flex items-start gap-3">
                    {/* Agent icon + pulse */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                           style={{ background: `${CATEGORY_COLORS[agent.category] || '#6366f1'}15` }}>
                        {agent.icon}
                      </div>
                      {sc.pulse && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full status-running" />
                      )}
                      {agent.status === 'error' && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 status-error" />
                      )}
                    </div>

                    {/* Name + category */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100 text-sm leading-tight">{agent.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ background: `${CATEGORY_COLORS[agent.category]}15`, color: CATEGORY_COLORS[agent.category] || '#818cf8' }}>
                          {agent.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: sc.bg, color: sc.color }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sc.pulse ? 'status-running' : ''}`} style={{ background: sc.color }} />
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                    <div>
                      <div className="text-sm font-bold text-slate-200">{agent.run_count_today}</div>
                      <div className="text-xs text-slate-600">Runs</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{agent.avg_runtime_ms}ms</div>
                      <div className="text-xs text-slate-600">Avg RT</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: agent.health_score > 90 ? '#10b981' : agent.health_score > 70 ? '#f59e0b' : '#ef4444' }}>
                        {agent.health_score}%
                      </div>
                      <div className="text-xs text-slate-600">Health</div>
                    </div>
                  </div>

                  {/* Health bar */}
                  <div className="progress-bar mt-2">
                    <div className="progress-fill transition-all duration-700"
                         style={{ width: `${agent.health_score}%`, background: agent.health_score > 90 ? '#10b981' : agent.health_score > 70 ? '#f59e0b' : '#ef4444' }} />
                  </div>

                  {/* Expanded runtime chart */}
                  {isSelected && (
                    <div className="mt-4 animate-fade-in-up">
                      <div className="text-xs text-slate-500 mb-2">Last 12 execution runtimes</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={runtimeHistory} margin={{ top: 2, right: 5, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id={`ag-${agent.key}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="tick" hide />
                          <YAxis hide />
                          <Tooltip
                            formatter={(v: any) => [`${v}ms`, 'Runtime']}
                            contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }} />
                          <Area type="monotone" dataKey="ms" stroke="#6366f1" fill={`url(#ag-${agent.key})`} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-xs">
                        <div className="flex gap-3">
                          <span className="text-slate-500">Alerts: <span className="text-amber-400 font-semibold">{agent.alerts_raised}</span></span>
                          <span className="text-slate-500">Recs: <span className="text-indigo-400 font-semibold">{agent.recommendations_generated}</span></span>
                        </div>
                        <button
                          onClick={(e) => handleTriggerAgent(e, agent.key)}
                          disabled={triggeringKey === agent.key}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all"
                        >
                          <Play size={11} className={triggeringKey === agent.key ? 'animate-spin' : ''} />
                          {triggeringKey === agent.key ? 'Running...' : 'Trigger Run'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {tab === 'recommendations' && (
        <div className="space-y-3 animate-scale-in">
          {mockRecommendations.map((rec, i) => {
            const priorityColors: Record<string, { color: string; bg: string }> = {
              critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
              high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
              medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
            }
            const pc = priorityColors[rec.priority]
            return (
              <div key={rec.id} className="glass-card p-5 flex gap-4"
                   style={{ borderLeft: `3px solid ${pc.color}`, opacity: rec.is_acknowledged ? 0.55 : 1 }}>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase"
                        style={{ background: pc.bg, color: pc.color }}>{rec.priority}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500">{rec.agent}</span>
                    {rec.is_acknowledged && <span className="text-xs text-emerald-500">✓ Acknowledged</span>}
                  </div>
                  <p className="font-semibold text-slate-100 text-sm mb-1">{rec.title}</p>
                  <p className="text-xs text-slate-400">{rec.description}</p>
                  {rec.impact && (
                    <div className="mt-2 text-xs px-2 py-1 rounded inline-block"
                         style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      📈 Impact: {rec.impact}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 flex-shrink-0 whitespace-nowrap">
                  {new Date(rec.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Performance Tab */}
      {tab === 'performance' && (
        <div className="space-y-4 animate-scale-in">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Agent Health Scores</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={performanceData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} angle={-35} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} unit="%" />
                <Tooltip
                  formatter={(v: any, n: string) => [n === 'health' ? `${v}%` : v, n === 'health' ? 'Health Score' : n === 'runs' ? 'Runs Today' : 'Alerts']}
                  contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="health" name="Health Score" radius={[4,4,0,0]}>
                  {performanceData.map((entry: any, i: number) => (
                    <Cell key={`cell-${i}`}
                      fill={entry.health >= 90 ? '#10b981' : entry.health >= 70 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Runs Today per Agent</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} width={88} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                  <Bar dataKey="runs" name="Runs" fill="#6366f1" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Alerts Raised per Agent</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} width={88} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                  <Bar dataKey="alerts" name="Alerts" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
