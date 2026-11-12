import sqlite3

DB = "gapsense.db"

def _conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init():
    with _conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, pages INTEGER, chunks INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT, doc_id INTEGER, difficulty TEXT, questions TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY AUTOINCREMENT, quiz_id INTEGER, doc_id INTEGER, score REAL, total INTEGER, percent REAL, report TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        """)

def q(sql, args=(), one=False):
    with _conn() as c:
        rows = [dict(r) for r in c.execute(sql, args).fetchall()]
    return (rows[0] if rows else None) if one else rows

def run(sql, args=()):
    with _conn() as c:
        return c.execute(sql, args).lastrowid
