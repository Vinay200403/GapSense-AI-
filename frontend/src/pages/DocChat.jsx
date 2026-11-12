import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Loading, ErrorMsg, Title } from '../ui'

export default function DocChat() {
  const [docs, setDocs] = useState([]), [scope, setScope] = useState('all'), [msgs, setMsgs] = useState([])
  const [text, setText] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), end = useRef()
  useEffect(() => { api.docs().then(setDocs).catch((e) => setErr(e.message)) }, [])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])
  const send = async (e) => {
    e.preventDefault(); const question = text.trim(); if (!question || busy) return
    setText(''); setErr(''); setMsgs((m) => [...m, { role: 'user', text: question }]); setBusy(true)
    try { const r = await api.chat(question, scope === 'all' ? null : [Number(scope)]); setMsgs((m) => [...m, { role: 'ai', text: r.answer, sources: r.sources }]) }
    catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div>
      <Title sub="Ask questions — answers come only from your documents">DocChat</Title>
      <select value={scope} onChange={(e) => setScope(e.target.value)} className="mb-3 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
        <option value="all">All documents</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <Card className="h-[55vh] overflow-y-auto space-y-3">
        {!msgs.length && <div className="text-slate-500 text-sm">{docs.length ? 'Ask something about your documents…' : 'Upload a document first.'}</div>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand text-white' : 'bg-sky-50'}`}>{m.text}
              {m.sources?.length > 0 && <div className="mt-2 pt-2 border-t border-sky-200 text-xs text-slate-600 space-y-1">
                {m.sources.map((s, k) => <div key={k}>📄 {s.doc} — p.{s.page}</div>)}</div>}</div></div>))}
        {busy && <Loading text="Thinking…" />}<div ref={end} /></Card>
      <div className="mt-3"><ErrorMsg>{err}</ErrorMsg></div>
      <form onSubmit={send} className="flex gap-2 mt-3"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" className="flex-1 rounded-xl border border-sky-200 px-3 py-2 text-sm" />
        <Btn disabled={busy || !text.trim()}>Send</Btn></form>
    </div>
  )
}
