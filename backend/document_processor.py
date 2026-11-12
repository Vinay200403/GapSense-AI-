import fitz  # PyMuPDF
import config

def extract_pages(data: bytes):
    doc = fitz.open(stream=data, filetype="pdf")
    pages = [(i + 1, p.get_text().strip()) for i, p in enumerate(doc)]
    return len(doc), [(n, t) for n, t in pages if t]

def chunk_pages(pages):
    """Split each page into overlapping chunks, keeping the page number."""
    chunks, size, ov = [], config.CHUNK_SIZE, config.CHUNK_OVERLAP
    for page, text in pages:
        text = " ".join(text.split())
        start = 0
        while start < len(text):
            chunks.append({"text": text[start:start + size], "page": page})
            start += size - ov
    return chunks
