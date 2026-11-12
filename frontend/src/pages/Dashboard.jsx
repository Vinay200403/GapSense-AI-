import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import { Card, Loading, ErrorMsg, Title, TopicRows, Empty } from '../ui'

export default function Dashboard({ go }) {
  const [d, setD] = useState(null), [err, setErr] = useState('')
  useEffect(() => { api.dashboard().then(setD).catch((e) => setErr(e.message)) }, [])
  if (err) return <ErrorMsg>{err}</ErrorMsg>
  if (!d) return <Loading />
  const stats = [['Documents', d.documents], ['Quizzes completed', d.quizzes], ['Average score', d.average == null ? '–' : d.average + '%']]
  return (
    <div>
      <Title sub="Your learning progress at a glance">Dashboard</Title>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">{stats.map(([k, v]) => <Card key={k}><div className="text-sm text-slate-500">{k}</div><div className="text-3xl font-bold text-brand">{v}</div></Card>)}</div>
      <Card className="mb-4"><h2 className="font-semibold mb-3">Knowledge improvement</h2>
        {d.progress.length ? <div className="h-56"><ResponsiveContainer><LineChart data={d.progress}><CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#7c5cff" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <Empty>Take a quiz to see your progress.</Empty>}</Card>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card><h2 className="font-semibold mb-3">Strongest topics</h2><TopicRows rows={d.strongest} /></Card>
        <Card><h2 className="font-semibold mb-3">Weakest topics</h2><TopicRows rows={d.weakest} /></Card></div>
      <Card><h2 className="font-semibold mb-3">Recent assessments</h2>
        {d.recent.length ? d.recent.map((a) => (
          <button key={a.id} onClick={() => go('gapsense', { attemptId: a.id })} className="w-full flex justify-between py-2 border-b border-sky-50 last:border-0 text-sm hover:text-brand">
            <span>{a.doc} · {a.created_at}</span><span className="font-semibold">{a.percent}%</span></button>)) : <Empty>No assessments yet.</Empty>}</Card>
    </div>
  )
}
