import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Loading, ErrorMsg, Empty, Title } from '../ui'

export default function Documents() {
  const [docs, setDocs] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const load = () => api.docs().then(setDocs).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const upload = async (e) => {
    const f = e.target.files[0]; if (!f) return
    setBusy(true); setErr('')
    try { await api.upload(f); await load() } catch (x) { setErr(x.message) }
    setBusy(false); e.target.value = ''
  }
  const del = async (id) => { if (!confirm('Delete this document and its quiz history?')) return; try { await api.delDoc(id); load() } catch (x) { setErr(x.message) } }
  return (
    <div>
      <Title sub="Upload PDFs to chat with and get quizzed on">Documents</Title>
      <Card className="mb-4"><label className="inline-block"><input type="file" accept=".pdf" onChange={upload} disabled={busy} className="hidden" />
        <span className={`px-4 py-2 rounded-xl text-sm font-medium bg-brand text-white cursor-pointer ${busy ? 'opacity-50' : ''}`}>{busy ? 'Processing…' : 'Upload PDF'}</span></label>
        {busy && <Loading text="Extracting text and generating embeddings (first upload downloads the model)…" />}</Card>
      <ErrorMsg>{err}</ErrorMsg>
      {!docs ? <Loading /> : docs.length === 0 ? <Empty>No documents yet.</Empty> : (
        <div className="grid gap-3 mt-3">{docs.map((d) => (
          <Card key={d.id} className="flex items-center justify-between"><div><div className="font-medium">{d.name}</div>
            <div className="text-xs text-slate-500">{d.pages} pages · {d.chunks} chunks · {d.created_at}</div></div>
            <Btn variant="soft" onClick={() => del(d.id)}>Delete</Btn></Card>))}</div>)}
    </div>
  )
}
