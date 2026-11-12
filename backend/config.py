from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

# Score thresholds (percent) for topic status
STRONG, GOOD, NEEDS_WORK = 80, 60, 40   # below NEEDS_WORK = Weak
CHUNK_SIZE, CHUNK_OVERLAP = 900, 150
