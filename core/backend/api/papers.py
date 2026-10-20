import asyncio
from fastapi import APIRouter, Form, File, UploadFile
from typing import List
from services.paper_service import evaluate_paper, delete_paper, recommend_related_papers

router = APIRouter()

@router.post("/upload")
async def upload_files(
    projectId: str = Form(...), 
    files: List[UploadFile] = File(...)
):
    if len(files) > 10:
        files = files[:10]
        
    semaphore = asyncio.Semaphore(5)
    
    async def process_file(file):
        try:
            async with semaphore:
                content = await file.read()
                return await asyncio.to_thread(evaluate_paper, projectId, file.filename, content)
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            return {
                "filename": file.filename,
                "relevance": "Medium",
                "reason": f"Failed to evaluate: {str(e)}",
                "status": "error"
            }
        
    results = await asyncio.gather(*(process_file(f) for f in files))
    return {"results": list(results)}

@router.post("/paper/delete")
async def delete_project_paper(projectId: str = Form(...), filename: str = Form(...)):
    success = delete_paper(projectId, filename)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to delete paper"}

@router.post("/related-papers")
async def related_papers(
    projectId: str = Form(...),
    startYear: str = Form(None),
    endYear: str = Form(None)
):
    papers = recommend_related_papers(projectId, startYear, endYear)
    return {"papers": papers}
