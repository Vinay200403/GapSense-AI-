import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Loading, ErrorMsg, Title, Empty } from '../ui'

export default function QuizForge({ go, params }) {
  const [docs, setDocs] = useState([]), [docId, setDocId] = useState(''), [num, setNum] = useState(6), [diff, setDiff] = useState('Medium')
  const [quiz, setQuiz] = useState(null), [ans, setAns] = useState({}), [res, setRes] = useState(null), [busy, setBusy] = useState(''), [err, setErr] = useState('')
  useEffect(() => {
    api.docs().then((d) => { setDocs(d); if (d[0]) setDocId(d[0].id) }).catch((e) => setErr(e.message))
    if (params?.quizId) { setBusy('Loading quiz…'); api.getQuiz(params.quizId).then(setQuiz).catch((e) => setErr(e.message)).finally(() => setBusy('')) }
  }, [])
  const wrap = async (msg, fn) => { setBusy(msg); setErr(''); try { await fn() } catch (e) { setErr(e.message) } setBusy('') }
  const generate = () => wrap('Generating quiz with Groq…', async () => { setQuiz(await api.makeQuiz({ doc_id: Number(docId), num, difficulty: diff })); setAns({}); setRes(null) })
  const submit = () => wrap('Evaluating your answers…', async () => setRes(await api.submit(quiz.id, ans)))
  const retake = () => wrap('Loading…', async () => { setQuiz(await api.getQuiz(res.quiz_id)); setAns({}); setRes(null) })
  const sel = 'rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm'

  if (busy && !quiz) return <div><Title>QuizForge</Title><Loading text={busy} /></div>
  if (res) return (
    <div><Title sub={`${res.score} / ${res.total} points`}>Your score: {res.percent}%</Title>
      <div className="space-y-3">{res.results.map((r, i) => (
        <Card key={r.id}><div className="text-xs text-slate-500 mb-1">Q{i + 1} · {r.topic}{r.page ? ` · p.${r.page}` : ''}</div>
          <div className="font-medium mb-2">{r.question}</div>
          <div className={`text-sm ${r.score === 1 ? 'text-emerald-600' : r.score > 0 ? 'text-amber-600' : 'text-red-600'}`}>Your answer: {r.user_answer || '(blank)'} {r.score === 1 ? '✓' : r.score > 0 ? '(partial)' : '✗'}</div>
          {r.score < 1 && <div className="text-sm">Correct: {r.answer}</div>}
          {r.feedback && <div className="text-sm text-slate-600">{r.feedback}</div>}
          <div className="text-sm text-slate-500 mt-1">{r.explanation}</div></Card>))}</div>
      <div className="flex gap-2 mt-4"><Btn onClick={() => go('gapsense', { attemptId: res.attempt_id })}>View GapSense report</Btn><Btn variant="soft" onClick={retake}>Retake quiz</Btn><Btn variant="soft" onClick={() => { setQuiz(null); setRes(null) }}>New quiz</Btn></div>
    </div>)
  if (quiz) {
    const done = quiz.questions.every((q) => (ans[q.id] || '').trim())
    return (
      <div><Title sub={`${quiz.doc} · ${quiz.difficulty}`}>Quiz</Title>
        <div className="space-y-3">{quiz.questions.map((q, i) => (
          <Card key={q.id}><div className="text-xs text-slate-500 mb-1">Q{i + 1} · {q.topic}</div><div className="font-medium mb-3">{q.question}</div>
            {q.type === 'short' ? <textarea rows={3} value={ans[q.id] || ''} onChange={(e) => setAns({ ...ans, [q.id]: e.target.value })} placeholder="Type your answer…" className="w-full rounded-xl border border-sky-200 p-2 text-sm" />
              : <div className="grid gap-2">{q.options.map((o) => (
                <button key={o} onClick={() => setAns({ ...ans, [q.id]: o })} className={`text-left rounded-xl border px-3 py-2 text-sm ${ans[q.id] === o ? 'border-brand bg-violet-50' : 'border-sky-200 hover:bg-sky-50'}`}>{o}</button>))}</div>}</Card>))}</div>
        <div className="mt-3"><ErrorMsg>{err}</ErrorMsg></div>
        <div className="flex items-center gap-3 mt-4"><Btn disabled={!done || !!busy} onClick={submit}>Submit answers</Btn><Btn variant="soft" onClick={() => setQuiz(null)}>Cancel</Btn>{busy && <Loading text={busy} />}</div>
      </div>)
  }
  return (
    <div><Title sub="Generate a quiz from your documents">QuizForge</Title>
      {!docs.length ? <Empty>Upload a document first.</Empty> : (
        <Card className="space-y-4 max-w-xl">
          <div><label className="text-sm font-medium">Document</label><select className={sel + ' w-full mt-1'} value={docId} onChange={(e) => setDocId(e.target.value)}>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="flex gap-4"><div><label className="text-sm font-medium">Questions</label><input type="number" min={3} max={20} value={num} onChange={(e) => setNum(Number(e.target.value))} className={sel + ' w-24 block mt-1'} /></div>
            <div><label className="text-sm font-medium">Difficulty</label><select className={sel + ' block mt-1'} value={diff} onChange={(e) => setDiff(e.target.value)}>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select></div></div>
          <p className="text-xs text-slate-500">Mix of multiple-choice, true/false and short-answer questions.</p>
          <ErrorMsg>{err}</ErrorMsg><Btn onClick={generate} disabled={!!busy}>Generate quiz</Btn>{busy && <Loading text={busy} />}</Card>)}
    </div>)
}
