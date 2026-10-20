from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import uuid

def chunk_text(text: str, filename: str, title: str = "", author: str = "", year: str = "", keywords: list = None) -> list[Document]:
    if keywords is None:
        keywords = []
        
    # 1. Split by Markdown headers (semantic chunking)
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on, strip_headers=False)
    md_header_splits = markdown_splitter.split_text(text)
    
    # Fallback if no headers were found
    if not md_header_splits:
        md_header_splits = [Document(page_content=text, metadata={})]

    # 2. Split further by character if chunks are still too large
    chunk_size = 1000
    chunk_overlap = 200
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    
    # Split the documents
    final_splits = text_splitter.split_documents(md_header_splits)
    
    # 3. Add standard metadata
    documents = []
    for doc in final_splits:
        chunk_id = str(uuid.uuid4())
        
        # Combine headers into a single section string if present
        section_parts = []
        for key in ["Header 1", "Header 2", "Header 3"]:
            if key in doc.metadata:
                section_parts.append(doc.metadata[key])
        section_name = " > ".join(section_parts)
        
        metadata = {
            "chunk_id": chunk_id,
            "filename": filename,
            "title": title if title else filename,
            "author": author,
            "page": 1, # Default placeholder
            "section": section_name,
            "year": year,
            "keywords": keywords
        }
        
        # Merge into existing metadata
        # Merge into existing metadata
        doc.metadata.update(metadata)
        documents.append(doc)
        
    return documents

def chunk_pages(pages: list[dict], filename: str, title: str = "", author: str = "", year: str = "", keywords: list = None) -> list[Document]:
    if keywords is None:
        keywords = []
        
    documents = []
    for page in pages:
        page_num = page["page_num"]
        page_text = page["text"]
        
        # We can reuse the same splitters from chunk_text
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on, strip_headers=False)
        md_header_splits = markdown_splitter.split_text(page_text)
        
        if not md_header_splits:
            md_header_splits = [Document(page_content=page_text, metadata={})]

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        final_splits = text_splitter.split_documents(md_header_splits)
        
        for doc in final_splits:
            chunk_id = str(uuid.uuid4())
            
            section_parts = []
            for key in ["Header 1", "Header 2", "Header 3"]:
                if key in doc.metadata:
                    section_parts.append(doc.metadata[key])
            section_name = " > ".join(section_parts)
            
            metadata = {
                "chunk_id": chunk_id,
                "filename": filename,
                "title": title if title else filename,
                "author": author,
                "page": page_num, # Real page number!
                "section": section_name,
                "year": year,
                "keywords": keywords
            }
            
            doc.metadata.update(metadata)
            documents.append(doc)
            
    return documents
