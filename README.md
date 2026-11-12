# GapSense AIpython -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
Backend: `cd backend && 
Edit `backend/.env` (GROQ_API_KEY, GROQ_MODEL), then `uvicorn main:app --reload --port 8000`
Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173