from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from security.security import router as auth_router
from api.projects import router as projects_router
from api.papers import router as papers_router
from api.rag import router as rag_router
from api.memory import router as memory_router
from api.tasks import router as tasks_router
from api.llm_settings import router as llm_settings_router

app = FastAPI(title="PaperInsight AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "PaperInsight API is running"}

# Note: auth_router and llm_settings_router have their own /api prefix defined in their files
app.include_router(auth_router)
app.include_router(llm_settings_router)

app.include_router(projects_router, prefix="/api")
app.include_router(papers_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
