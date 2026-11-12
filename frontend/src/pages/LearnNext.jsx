import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Loading, ErrorMsg, Title, Empty, Badge } from '../ui'

export default function LearnNext({ go }) {
  const [items, setItems] = useState(null), [err, setErr] = useState(''), [busy, setBusy] = useState('')
  useEffect(() => { api.learnnext().then(setItems).catch((e) => setErr(e.message)) }, [])
  const practice = async (t) => {
    setBusy(t.topic); setErr('')
    try { const q = await api.makeQuiz({ doc_id: t.doc_id, num: 5, difficulty: 'Medium', topics: [t.topic] }); go('quizforge', { quizId: q.id }) }
    catch (e) { setErr(e.message); setBusy('') }
  }
  return (
    <div><Title sub="Personalized study plan based on your weak topics">LearnNext</Title>
      <ErrorMsg>{err}</ErrorMsg>
      {!items ? !err && <Loading text="Building your study plan…" /> : !items.length ? <Empty>No weak topics right now. Take more quizzes to get recommendations.</Empty> : (
        <div className="space-y-4 mt-3">{items.map((t) => (
          <Card key={t.topic}><div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{t.topic}</h2><span className="flex items-center gap-2 text-sm">{t.score}% <Badge s={t.status} /></span></div>
            <p className="text-sm text-slate-600">{t.explanation}</p>
            {t.tips.length > 0 && <ul className="list-disc ml-5 mt-2 text-sm">{t.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>}
            <div className="mt-3 text-sm"><div className="font-medium mb-1">Review these sections</div>
              {t.sections.map((s, i) => <div key={i} className="text-slate-600">📄 {s.doc} — p.{s.page}</div>)}</div>
            <Btn className="mt-3" disabled={!!busy} onClick={() => practice(t)}>{busy === t.topic ? 'Generating…' : 'Practice this topic'}</Btn></Card>))}</div>)}
    </div>)
}
