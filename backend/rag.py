import json
import chromadb
from groq import Groq
from sentence_transformers import SentenceTransformer
import config

_groq = Groq(api_key=config.GROQ_API_KEY) if config.GROQ_API_KEY else None
_embedder = None
_col = chromadb.PersistentClient(path="chroma_db").get_or_create_collection(
    "chunks", metadata={"hnsw:space": "cosine"})

def _emb():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

def llm(messages, json_mode=False, temperature=0.3):
    if not _groq or not config.GROQ_MODEL:
        raise RuntimeError("Set GROQ_API_KEY and GROQ_MODEL in backend/.env")
    kw = {"response_format": {"type": "json_object"}} if json_mode else {}
    r = _groq.chat.completions.create(model=config.GROQ_MODEL, messages=messages,
                                      temperature=temperature, **kw)
    out = r.choices[0].message.content
    return json.loads(out) if json_mode else out

def add_document(doc_id, name, chunks):
    texts = [c["text"] for c in chunks]
    vecs = _emb().encode(texts).tolist()
    _col.add(ids=[f"{doc_id}-{i}" for i in range(len(texts))], documents=texts, embeddings=vecs,
             metadatas=[{"doc_id": doc_id, "doc": name, "page": c["page"], "i": i} for i, c in enumerate(chunks)])

def delete_document(doc_id):
    _col.delete(where={"doc_id": doc_id})

def search(query, doc_ids=None, k=5):
    kw = {"where": {"doc_id": {"$in": doc_ids}}} if doc_ids else {}
    r = _col.query(query_embeddings=_emb().encode([query]).tolist(), n_results=k, **kw)
    return [{"text": t, "doc": m["doc"], "page": m["page"]} for t, m in zip(r["documents"][0], r["metadatas"][0])]

def sample_chunks(doc_id, n=10):
    """Evenly spaced chunks across a document, in reading order."""
    r = _col.get(where={"doc_id": doc_id})
    items = sorted(zip(r["documents"], r["metadatas"]), key=lambda x: x[1]["i"])
    step = max(1, len(items) // n)
    return [{"text": t, "doc": m["doc"], "page": m["page"]} for t, m in items[::step][:n]]

def ask(question, doc_ids=None):
    hits = search(question, doc_ids, k=5)
    if not hits:
        return {"answer": "No documents found. Upload a PDF first.", "sources": []}
    ctx = "\n\n".join(f"[{h['doc']}, p.{h['page']}]\n{h['text']}" for h in hits)
    out = llm([
        {"role": "system", "content": "Answer ONLY from the provided context. If the context does not contain the answer, "
         "say so and do not invent anything. Return JSON: {\"answer\": str, \"found\": bool}."},
        {"role": "user", "content": f"Context:\n{ctx}\n\nQuestion: {question}"}], json_mode=True, temperature=0.1)
    found = out.get("found", True)
    seen, sources = set(), []
    for h in hits if found else []:
        key = (h["doc"], h["page"])
        if key not in seen:
            seen.add(key)
            sources.append({"doc": h["doc"], "page": h["page"], "snippet": h["text"][:160] + "…"})
    return {"answer": out.get("answer", ""), "sources": sources}
