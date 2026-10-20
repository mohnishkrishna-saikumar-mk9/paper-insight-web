import os
import re
import io
import pypdf
from llm.models import execute_vision_with_llm

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "data", "extracted_images")
os.makedirs(IMAGE_DIR, exist_ok=True)

IMAGE_CAPTION_PROMPT = "You are an expert data scientist. Describe this academic figure or table in extreme detail. What data is it conveying? What are the axes? What is the core takeaway? Do not mention that this is an image, just describe the content directly."

def extract_text_from_pdf(buffer: bytes) -> str:
    pdf = pypdf.PdfReader(io.BytesIO(buffer))
    text = ""
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n\n"
    return text

def extract_pages_from_pdf(buffer: bytes) -> list[dict]:
    pdf = pypdf.PdfReader(io.BytesIO(buffer))
    pages = []
    for i, page in enumerate(pdf.pages):
        page_text = page.extract_text()
        if page_text:
            pages.append({"page_num": i + 1, "text": page_text})
    return pages
