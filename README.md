# GapSense AI

> **Discover the gaps. Strengthen your knowledge.**

GapSense AI is an AI-powered learning platform that helps you find out what you *don't* know. Upload study material as a PDF, chat with it, take an AI-generated quiz, and get a topic-by-topic diagnosis of your strengths and weaknesses, along with a personalized revision plan.

It is built as a simple, custom **RAG (Retrieval-Augmented Generation)** pipeline with no heavy frameworks, so every step is easy to read and understand.

---

## Features

| Module | What it does |
|---|---|
| **Documents** | Upload PDFs, extract text per page, chunk it, embed it, and store vectors in ChromaDB. List and delete documents. |
| **DocChat** | Ask questions about your documents. Answers come only from retrieved content, with document and page references. If the answer isn't in the document, it says so. |
| **QuizForge** | Generate multiple-choice, true/false and short-answer quizzes at Easy, Medium or Hard difficulty. Choose the number of questions, submit, and review explanations. |
| **GapSense** | Maps each question to a topic, computes topic-wise scores, labels topics Strong / Good / Needs Improvement / Weak, and explains each gap in simple language. Short answers are graded by the LLM on understanding, not keywords. |
| **LearnNext** | Recommends weak topics, explains difficult concepts, points to the relevant document pages, and generates focused practice quizzes. |
| **Dashboard** | Document count, quizzes completed, average score, strongest and weakest topics, recent assessments, and a progress chart. |

No login or signup. The app opens directly on the dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Uvicorn |
| LLM | Groq API |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Vector database | ChromaDB (persistent, local) |
| Database | SQLite |
| PDF processing | PyMuPDF |

---

## How It Works

```
                ┌──────────────────────── React (browser) ────────────────────────┐
                │ Dashboard · Documents · DocChat · QuizForge · GapSense · LearnNext │
                └───────────────────────────────┬─────────────────────────────────┘
                                                │  /api  (Vite proxy)
                                      ┌─────────▼──────────┐
                                      │   FastAPI (main.py) │
                                      └─┬────────┬────────┬─┘
                  PDF → chunks          │        │        │         scores & reports
        document_processor.py ◄─────────┘        │        └────────► gap_analyzer.py
                                                 │
                                   rag.py (embeddings · ChromaDB · Groq)
                                                 │
                          ┌──────────────────────┴───────────────────┐
                          │ ChromaDB (vectors)      SQLite (records) │
                          └──────────────────────────────────────────┘
```

**Workflow**

1. Upload a PDF. Text is extracted page by page and split into overlapping chunks (~900 characters).
2. Each chunk is embedded and stored in ChromaDB with its document name and page number.
3. **DocChat:** your question is embedded, the 5 most similar chunks are retrieved, and Groq answers using only that context.
4. **QuizForge:** evenly spaced chunks from the document are sent to Groq, which returns structured JSON questions, each tagged with a topic and page.
5. Multiple-choice and true/false answers are graded by exact match. Short answers are graded by Groq on conceptual understanding.
6. **GapSense:** scores are grouped by topic and mapped to a status using configurable thresholds. Groq explains each gap.
7. **LearnNext:** topic scores are averaged across all attempts, and the weakest topics get explanations, page references and practice quizzes.
8. Results are stored in SQLite and shown on the dashboard.

---

## Project Structure

```
gapsense/
├── README.md
├── .gitignore
├── backend/
│   ├── main.py                # FastAPI app and all API endpoints
│   ├── config.py              # .env loading, score thresholds, chunk settings
│   ├── rag.py                 # Embeddings, ChromaDB search, Groq helper, DocChat logic
│   ├── document_processor.py  # PDF text extraction and chunking
│   ├── quiz_generator.py      # Quiz generation and validation
│   ├── gap_analyzer.py        # Grading, topic scores, gap explanations
│   ├── database.py            # SQLite tables and helpers
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js         # Dev server and /api proxy
    ├── tailwind.config.js
    └── src/
        ├── App.jsx            # Sidebar layout and page navigation
        ├── api.js             # API service
        ├── ui.jsx             # Shared UI components
        └── pages/             # Dashboard, Documents, DocChat, QuizForge, GapSense, LearnNext
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- A **Groq API key** from [console.groq.com](https://console.groq.com)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/gapsense-ai.git
cd gapsense-ai
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_supported_groq_model_name
```

Use a current chat model ID from [Groq's model list](https://console.groq.com/docs/models) that supports JSON output. Model names change over time, so check the list if you get a "model not found" error.

> `.env` is listed in `.gitignore`. Never commit your API key. The key is only ever read by the backend and is never exposed to frontend code.

### 4. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

Interactive API docs are at http://localhost:8000/docs.

### 5. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

> The first PDF upload downloads the embedding model, so it takes longer than later uploads.

---

## Usage

1. **Documents:** upload a text-based PDF.
2. **DocChat:** ask questions and check the page references under each answer.
3. **QuizForge:** pick a document, number of questions and difficulty, then generate, answer and submit.
4. **GapSense:** review topic scores, status labels and gap explanations.
5. **LearnNext:** follow the study plan and click **Practice this topic** for a focused quiz.
6. **Dashboard:** track your progress over time.

---

## Configuration

Edit `backend/config.py`:

```python
STRONG, GOOD, NEEDS_WORK = 80, 60, 40   # below 40 = Weak
CHUNK_SIZE, CHUNK_OVERLAP = 900, 150
```

| Score | Status |
|---|---|
| 80% and above | Strong |
| 60 – 79% | Good |
| 40 – 59% | Needs Improvement |
| Below 40% | Weak |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Upload and index a PDF |
| DELETE | `/api/documents/{id}` | Delete a document and its data |
| POST | `/api/chat` | Ask a question about documents |
| POST | `/api/quizzes` | Generate a quiz |
| GET | `/api/quizzes/{id}` | Load a quiz (answers hidden) |
| POST | `/api/quizzes/{id}/submit` | Submit answers and get the gap report |
| GET | `/api/attempts` | List past attempts |
| GET | `/api/attempts/{id}` | Get one attempt's full report |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/learnnext` | Personalized recommendations |

---

## Design Decisions

- **Custom RAG pipeline** instead of a framework, for fewer dependencies and full transparency.
- **Overlapping chunks, one page per chunk**, so ideas aren't cut at boundaries and every source reference is accurate.
- **Grounded answers:** the model returns a `found` flag, and sources are shown only when it found an answer.
- **Validated LLM output:** Groq runs in JSON mode, and every generated question is still checked before it is saved.
- **Server-side grading:** quiz answers are never sent to the browser.
- **Two databases:** ChromaDB for semantic search, SQLite for structured history.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the backend" | Make sure uvicorn is running on port 8000. |
| "Set GROQ_API_KEY and GROQ_MODEL" | Fill in `backend/.env` and start uvicorn from the `backend/` folder. |
| Model not found or decommissioned | Update `GROQ_MODEL` to a current model ID and restart the backend. |
| "No extractable text found" | The PDF is scanned images. Use a text-based PDF. |
| Quiz generation returned no questions | Try again, or use a document with more text. |
| Dependency install fails | Upgrade pip and use Python 3.10 – 3.12. |

---

## Limitations

- Scanned PDFs are not supported (no OCR).
- Topic names are produced by the LLM, so similar names may occasionally split a topic's score.
- Multiple-choice grading relies on the model returning the exact text of the correct option.
- There is no user authentication, since the app is single-user by design.
- Quiz quality depends on the chosen model and the source document.

---

## Future Improvements

- OCR support for scanned documents
- Topic normalization across quizzes
- Spaced-repetition revision scheduling
- Streaming chat responses
- User accounts and multi-user support
- Automated tests and quiz-quality evaluation

---

## Author

**K Vinay Kumar**
Computer Science & Engineering graduate, Bengaluru, India
GitHub: `https://github.com/Vinay200403` · LinkedIn: `www.linkedin.com/in/vk2303`

---

## License

Released under the MIT License. 
