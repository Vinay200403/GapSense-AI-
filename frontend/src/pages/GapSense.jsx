import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../api'
import { Card, Btn, Loading, ErrorMsg, Title, Empty, Badge } from '../ui'

const FILL = { Strong: '#10b981', Good: '#0ea5e9', 'Needs Improvement': '#f59e0b', Weak: '#ef4444' }

export default function GapSense({ go, params }) {
  const [list, setList] = useState(null), [id, setId] = useState(params?.attemptId || ''), [rep, setRep] = useState(null), [err, setErr] = useState('')
  useEffect(() => { api.attempts().then((a) => { setList(a); if (!id && a[0]) setId(a[0].id) }).catch((e) => setErr(e.message)) }, [])
  useEffect(() => { if (id) { setRep(null); api.attempt(id).then(setRep).catch((e) => setErr(e.message)) } }, [id])
  if (err) return <ErrorMsg>{err}</ErrorMsg>
  if (!list) return <Loading />
  if (!list.length) return <div><Title>GapSense</Title><Empty>Complete a quiz in QuizForge to see your knowledge gaps.</Empty></div>
  return (
    <div><Title sub="Where you're strong and where to focus">GapSense</Title>
      <select value={id} onChange={(e) => setId(e.target.value)} className="mb-4 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
        {list.map((a) => <option key={a.id} value={a.id}>{a.doc} · {a.created_at} · {a.percent}%</option>)}</select>
      {!rep ? <Loading /> : <>
        <Card className="mb-4"><div className="text-3xl font-bold text-brand">{rep.percent}%</div><p className="text-sm text-slate-600 mt-1">{rep.summary}</p></Card>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card><h2 className="font-semibold mb-3">Topic scores</h2>
            <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>Topic</th><th className="text-right">Score</th><th className="text-right">Status</th></tr></thead>
              <tbody>{rep.topics.map((t) => <tr key={t.topic} className="border-t border-sky-50"><td className="py-2">{t.topic}</td><td className="text-right">{t.score}%</td><td className="text-right"><Badge s={t.status} /></td></tr>)}</tbody></table></Card>
          <Card><h2 className="font-semibold mb-3">Overview</h2><div className="h-56"><ResponsiveContainer><BarChart data={rep.topics}><XAxis dataKey="topic" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>{rep.topics.map((t) => <Cell key={t.topic} fill={FILL[t.status]} />)}</Bar></BarChart></ResponsiveContainer></div></Card></div>
        {rep.gaps.length > 0 && <Card className="mb-4"><h2 className="font-semibold mb-3">Knowledge gaps explained</h2><div className="space-y-4">{rep.gaps.map((g) => (
          <div key={g.topic}><div className="font-medium">{g.topic}</div><p className="text-sm text-slate-600">{g.explanation}</p>
            <div className="flex flex-wrap gap-1 mt-1">{(g.concepts || []).map((c) => <span key={c} className="text-xs bg-violet-50 text-brand rounded-full px-2 py-0.5">{c}</span>)}</div></div>))}</div></Card>}
        <Card><h2 className="font-semibold mb-2">Recommended revision</h2>
          {rep.revise.length ? <p className="text-sm">Revise: <b>{rep.revise.join(', ')}</b></p> : <p className="text-sm">Nothing urgent — great work!</p>}
          <div className="flex gap-2 mt-3"><Btn onClick={() => go('learnnext')}>Open LearnNext</Btn><Btn variant="soft" onClick={() => go('quizforge', { quizId: rep.quiz_id })}>Retake this quiz</Btn></div></Card></>}
    </div>)
}
