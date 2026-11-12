import json
import config
from rag import llm

def status(p):
    return ("Strong" if p >= config.STRONG else "Good" if p >= config.GOOD
            else "Needs Improvement" if p >= config.NEEDS_WORK else "Weak")

def _grade_short(items):
    payload = [{"id": q["id"], "question": q["question"], "reference_answer": q["answer"], "student_answer": a}
               for q, a in items if a]
    if not payload:
        return {}
    out = llm([{"role": "system", "content": "Grade short answers on conceptual understanding, not keyword matching. "
                'Return JSON: {"grades":[{"id":str,"score":0|0.5|1,"feedback":"one sentence"}]}'},
               {"role": "user", "content": json.dumps(payload)}], json_mode=True, temperature=0)
    return {g["id"]: g for g in out.get("grades", [])}

def analyze(questions, answers):
    get = lambda q: (answers.get(q["id"]) or "").strip()
    graded = _grade_short([(q, get(q)) for q in questions if q["type"] == "short"])
    results = []
    for q in questions:
        a = get(q)
        if q["type"] == "short":
            g = graded.get(q["id"], {})
            score, fb = float(g.get("score", 0)), g.get("feedback") or ("No answer given." if not a else "")
        else:
            score, fb = (1.0 if a.lower() == str(q["answer"]).lower() else 0.0), ""
        results.append({**q, "user_answer": a, "score": score, "feedback": fb})

    agg = {}
    for r in results:
        t = agg.setdefault(r["topic"], [0, 0]); t[0] += r["score"]; t[1] += 1
    topics = sorted(({"topic": k, "score": round(100 * v[0] / v[1]), "status": status(round(100 * v[0] / v[1])),
                      "questions": v[1]} for k, v in agg.items()), key=lambda x: x["score"])
    points, total = sum(r["score"] for r in results), len(results)

    summary, gaps = "Perfect score — no gaps found!", []
    missed = [{"topic": r["topic"], "question": r["question"], "correct_answer": r["answer"], "student_answer": r["user_answer"]}
              for r in results if r["score"] < 1]
    if missed:
        out = llm([{"role": "system", "content": "You are a friendly tutor. Given topic scores and missed questions, return JSON: "
                    '{"summary":"2 sentences","gaps":[{"topic":str,"explanation":"simple 2-3 sentence explanation of the concept the student is missing","concepts":["short concept"]}]} '
                    "Include only topics that are not Strong."},
                   {"role": "user", "content": json.dumps({"topics": topics, "missed": missed})}], json_mode=True)
        summary, gaps = out.get("summary", ""), out.get("gaps", [])
    return {"score": points, "total": total, "percent": round(100 * points / total), "summary": summary,
            "topics": topics, "gaps": gaps, "revise": [t["topic"] for t in topics if t["score"] < config.GOOD],
            "results": results}
