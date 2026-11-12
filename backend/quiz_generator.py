from rag import llm, search, sample_chunks

SYSTEM = """You create study quizzes strictly from the provided document excerpts. Return JSON only:
{"questions":[{"type":"mcq"|"tf"|"short","topic":"2-4 word topic name","question":"...",
"options":["a","b","c","d"] (mcq only),"answer":"mcq: exact text of the correct option; tf: True or False; short: concise model answer",
"explanation":"1-2 sentences","page":<page number from the excerpt>}]}
Rules: use a roughly equal mix of mcq, tf and short; group questions under 3-5 recurring topics so topic scores are meaningful;
use no outside knowledge."""

def generate(doc_id, n, difficulty, topics=None):
    chunks = search(" ".join(topics), [doc_id], 8) if topics else sample_chunks(doc_id, 10)
    ctx = "\n\n".join(f"[Page {c['page']}]\n{c['text']}" for c in chunks)
    out = llm([{"role": "system", "content": SYSTEM},
               {"role": "user", "content": f"Create {n} {difficulty}-difficulty questions."
                + (f" Focus on these topics: {', '.join(topics)}." if topics else "") + f"\n\nExcerpts:\n{ctx}"}],
              json_mode=True, temperature=0.4)
    qs = []
    for r in out.get("questions", []):
        t = r.get("type")
        if t not in ("mcq", "tf", "short") or not r.get("question") or not r.get("answer"):
            continue
        if t == "mcq" and (len(r.get("options", [])) < 2 or r["answer"] not in r["options"]):
            continue
        if t == "tf":
            r["options"] = ["True", "False"]
            r["answer"] = "True" if str(r["answer"]).lower().startswith("t") else "False"
        if t == "short":
            r.pop("options", None)
        r["topic"] = (r.get("topic") or "General").strip().title()
        r["id"] = f"q{len(qs) + 1}"
        r["page"] = r.get("page") if isinstance(r.get("page"), int) else None
        qs.append(r)
    if not qs:
        raise RuntimeError("The model returned no valid questions. Try again.")
    return qs[:n]
