import React from 'react'
export const Card = ({ className = '', ...p }) => <div className={`bg-white rounded-2xl shadow-sm border border-sky-100 p-5 ${className}`} {...p} />
export const Btn = ({ className = '', variant = 'primary', ...p }) => (
  <button className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${variant === 'primary' ? 'bg-brand text-white hover:bg-violet-600' : 'bg-sky-100 text-navy hover:bg-sky-200'} ${className}`} {...p} />)
export const Loading = ({ text = 'Loading…' }) => <div className="flex items-center gap-2 text-slate-500 p-4"><span className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />{text}</div>
export const ErrorMsg = ({ children }) => children ? <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-sm">{children}</div> : null
export const Empty = ({ children }) => <div className="text-slate-500 text-sm p-4">{children}</div>
export const Title = ({ children, sub }) => <div className="mb-5"><h1 className="text-2xl font-bold">{children}</h1>{sub && <p className="text-slate-500 text-sm">{sub}</p>}</div>
const COLORS = { Strong: 'bg-emerald-100 text-emerald-700', Good: 'bg-sky-100 text-sky-700', 'Needs Improvement': 'bg-amber-100 text-amber-700', Weak: 'bg-red-100 text-red-700' }
const BAR = { Strong: 'bg-emerald-500', Good: 'bg-sky-500', 'Needs Improvement': 'bg-amber-500', Weak: 'bg-red-500' }
export const Badge = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[s]}`}>{s}</span>
export const TopicRows = ({ rows }) => rows.length ? (
  <div className="space-y-3">{rows.map((t) => (
    <div key={t.topic}><div className="flex justify-between text-sm mb-1"><span className="font-medium">{t.topic}</span><span className="flex items-center gap-2">{t.score}% <Badge s={t.status} /></span></div>
      <div className="h-2 bg-sky-100 rounded-full"><div className={`h-2 rounded-full ${BAR[t.status]}`} style={{ width: t.score + '%' }} /></div></div>))}</div>
) : <Empty>No data yet. Complete a quiz first.</Empty>
