from langchain_openai import ChatOpenAI
from api.llm_settings import active_connection
import time

def execute_with_llm(prompt_template, input_dict, max_retries=3):
    last_error = None
    # We pass None for session, the bypass in security.py handles it if auth is disabled.
    base_url, api_key, model = active_connection(None)
    
    for attempt in range(max_retries):
        try:
            llm = ChatOpenAI(
                api_key=api_key or "empty_key",
                model=model,
                temperature=0.2,
                base_url=base_url
            )
            chain = prompt_template | llm
            return chain.invoke(input_dict)
        except Exception as e:
            error_str = str(e).lower()
            last_error = e
            print(f"Error with OmniRoute/Provider: {e}.")
        
        if attempt < max_retries - 1:
            wait_time = (attempt + 1) * 15 # 15s, 30s...
            print(f"Waiting {wait_time}s before retrying (Attempt {attempt+2}/{max_retries})...")
            time.sleep(wait_time)
            
    raise Exception(f"OmniRoute/Provider failed after {max_retries} attempts. Last error: {last_error}")

import base64
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from services.auth_service import get_openai_key

def execute_vision_with_llm(prompt_text: str, image_path: str):
    key = get_openai_key()
    llm = ChatOpenAI(api_key=key, model="gpt-4o-mini", temperature=0.1)
    
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    msg = HumanMessage(
        content=[
            {"type": "text", "text": prompt_text},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_string}"}}
        ]
    )
    return llm.invoke([msg])
