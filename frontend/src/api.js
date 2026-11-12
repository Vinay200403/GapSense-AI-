async function req(path, opts = {}) {
  let r
  try { r = await fetch('/api' + path, opts) } catch { throw new Error('Cannot reach the backend. Is it running on port 8000?') }
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || 'Request failed')
  return d
}
const j = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const api = {
  docs: () => req('/documents'),
  upload: (f) => { const fd = new FormData(); fd.append('file', f); return req('/documents', { method: 'POST', body: fd }) },
  delDoc: (id) => req('/documents/' + id, { method: 'DELETE' }),
  chat: (question, doc_ids) => req('/chat', j({ question, doc_ids })),
  makeQuiz: (b) => req('/quizzes', j(b)),
  getQuiz: (id) => req('/quizzes/' + id),
  submit: (id, answers) => req(`/quizzes/${id}/submit`, j({ answers })),
  attempts: () => req('/attempts'),
  attempt: (id) => req('/attempts/' + id),
  dashboard: () => req('/dashboard'),
  learnnext: () => req('/learnnext'),
}
