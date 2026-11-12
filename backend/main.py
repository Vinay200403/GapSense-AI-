import json
from collections import defaultdict
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import config, database as db, document_processor as dp, rag, quiz_generator, gap_analyzer
from database import q, run

app = FastAPI(title="GapSense AI")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
db.init()

def fail(msg, e, code=500):
    raise HTTPException(code, f"{msg}: {e}")

class ChatReq(BaseModel):
    question: str
    doc_ids: list[int] | None = None

class QuizReq(BaseModel):
    doc_id: int
    num: int = 6
    difficulty: str = "Medium"
    topics: list[str] | None = None

class SubmitReq(BaseModel):
    answers: dict[str, str]

# ---------- documents ----------
@app.get("/api/documents")
def docs():
    return q("SELECT * FROM documents ORDER BY id DESC")

@app.post("/api/documents")
async def upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")
    try:
        n_pages, pages = dp.extract_pages(await file.read())
    except Exception as e:
        fail("Could not read PDF", e, 400)
    if not pages:
        raise HTTPException(400, "No extractable text found (scanned PDFs are not supported).")
    chunks = dp.chunk_pages(pages)
    doc_id = run("INSERT INTO documents(name,pages,chunks) VALUES(?,?,?)", (file.filename, n_pages, len(chunks)))
    try:
        rag.add_document(doc_id, file.filename, chunks)
    except Exception as e:
        run("DELETE FROM documents WHERE id=?", (doc_id,))
        fail("Embedding failed", e)
    return q("SELECT * FROM documents WHERE id=?", (doc_id,), one=True)

@app.delete("/api/documents/{doc_id}")
def delete_doc(doc_id: int):
    rag.delete_document(doc_id)
    for t in ("attempts", "quizzes"):
        run(f"DELETE FROM {t} WHERE doc_id=?", (doc_id,))
    run("DELETE FROM documents WHERE id=?", (doc_id,))
    return {"ok": True}

# ---------- chat ----------
@app.post("/api/chat")
def chat(b: ChatReq):
    try:
        return rag.ask(b.question, b.doc_ids)
    except Exception as e:
        fail("Chat failed", e)

# ---------- quizzes ----------
def public_quiz(quiz_id, doc_name, difficulty, qs):
    hide = ("answer", "explanation")
    return {"id": quiz_id, "doc": doc_name, "difficulty": difficulty,
            "questions": [{k: v for k, v in x.items() if k not in hide} for x in qs]}

@app.post("/api/quizzes")
def make_quiz(b: QuizReq):
    doc = q("SELECT * FROM documents WHERE id=?", (b.doc_id,), one=True)
    if not doc:
        raise HTTPException(404, "Document not found")
    try:
        qs = quiz_generator.generate(b.doc_id, max(3, min(b.num, 20)), b.difficulty, b.topics)
    except Exception as e:
        fail("Quiz generation failed", e)
    qid = run("INSERT INTO quizzes(doc_id,difficulty,questions) VALUES(?,?,?)", (b.doc_id, b.difficulty, json.dumps(qs)))
    return public_quiz(qid, doc["name"], b.difficulty, qs)

@app.get("/api/quizzes/{quiz_id}")
def get_quiz(quiz_id: int):
    r = q("SELECT z.*, d.name FROM quizzes z JOIN documents d ON d.id=z.doc_id WHERE z.id=?", (quiz_id,), one=True)
    if not r:
        raise HTTPException(404, "Quiz not found")
    return public_quiz(quiz_id, r["name"], r["difficulty"], json.loads(r["questions"]))

@app.post("/api/quizzes/{quiz_id}/submit")
def submit(quiz_id: int, b: SubmitReq):
    r = q("SELECT * FROM quizzes WHERE id=?", (quiz_id,), one=True)
    if not r:
        raise HTTPException(404, "Quiz not found")
    try:
        rep = gap_analyzer.analyze(json.loads(r["questions"]), b.answers)
    except Exception as e:
        fail("Evaluation failed", e)
    aid = run("INSERT INTO attempts(quiz_id,doc_id,score,total,percent,report) VALUES(?,?,?,?,?,?)",
              (quiz_id, r["doc_id"], rep["score"], rep["total"], rep["percent"], json.dumps(rep)))
    return {"attempt_id": aid, "quiz_id": quiz_id, **rep}

# ---------- attempts / dashboard / learnnext ----------
@app.get("/api/attempts")
def attempts():
    return q("SELECT a.id,a.quiz_id,a.percent,a.score,a.total,a.created_at,d.name AS doc FROM attempts a "
             "LEFT JOIN documents d ON d.id=a.doc_id ORDER BY a.id DESC")

@app.get("/api/attempts/{aid}")
def attempt(aid: int):
    r = q("SELECT * FROM attempts WHERE id=?", (aid,), one=True)
    if not r:
        raise HTTPException(404, "Attempt not found")
    return {"attempt_id": aid, "quiz_id": r["quiz_id"], "created_at": r["created_at"], **json.loads(r["report"])}

def topic_averages():
    """Average score per topic across all attempts (+ the doc each topic came from)."""
    acc, doc_of = defaultdict(list), {}
    for a in q("SELECT doc_id, report FROM attempts ORDER BY id"):
        for t in json.loads(a["report"])["topics"]:
            acc[t["topic"]].append(t["score"]); doc_of[t["topic"]] = a["doc_id"]
    rows = [{"topic": k, "score": round(sum(v) / len(v)), "status": gap_analyzer.status(round(sum(v) / len(v))),
             "doc_id": doc_of[k]} for k, v in acc.items()]
    return sorted(rows, key=lambda r: r["score"])

@app.get("/api/dashboard")
def dashboard():
    att = q("SELECT id,percent,created_at FROM attempts ORDER BY id")
    tops = topic_averages()
    return {"documents": q("SELECT COUNT(*) n FROM documents", one=True)["n"], "quizzes": len(att),
            "average": round(sum(a["percent"] for a in att) / len(att)) if att else None,
            "strongest": tops[::-1][:3], "weakest": tops[:3],
            "recent": attempts()[:5],
            "progress": [{"name": f"#{i + 1}", "score": a["percent"]} for i, a in enumerate(att)]}

@app.get("/api/learnnext")
def learnnext():
    weak = [t for t in topic_averages() if t["score"] < config.GOOD][:4]
    if not weak:
        return []
    for t in weak:
        t["sections"] = [{"doc": h["doc"], "page": h["page"], "snippet": h["text"][:200] + "…"}
                         for h in rag.search(t["topic"], [t["doc_id"]], 3)]
    try:
        ctx = {t["topic"]: [s["snippet"] for s in t["sections"]] for t in weak}
        out = rag.llm([{"role": "system", "content": 'Explain difficult concepts simply using the excerpts. Return JSON: '
                        '{"topics":[{"topic":str,"explanation":"3-4 sentence beginner-friendly explanation","tips":["study tip"]}]}'},
                       {"role": "user", "content": json.dumps(ctx)}], json_mode=True)
    except Exception as e:
        fail("Recommendation failed", e)
    by = {x["topic"]: x for x in out.get("topics", [])}
    for t in weak:
        t["explanation"] = by.get(t["topic"], {}).get("explanation", "")
        t["tips"] = by.get(t["topic"], {}).get("tips", [])
    return weak
