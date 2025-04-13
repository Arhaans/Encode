# python/rag_researcher.py
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

app = FastAPI(title="Researcher RAG Service")

# --- Configuration ---
GOOGLE_GEMINI_API_KEY = "AIzaSyDU8mIzLFSiCvGVXqfNwDa4v0FN6NvGBg4"  # Replace with your actual API key

# Initialize the Gemini LLM instance for researchers.
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0.4,
        max_tokens=2000,
        api_key=GOOGLE_GEMINI_API_KEY
    )
except Exception as e:
    print("Error initializing Google Gemini LLM:", e)
    llm = None

# Define the Pydantic model for researcher requests.
class ResearcherRAGRequest(BaseModel):
    query: str
    aggregated_context: str  # Aggregated/anonymized report data

# Researcher prompt template modeled after your initial design.
researcher_prompt_template = """
You are a helpful AI assistant aiding a healthcare researcher.
You have access to aggregated, anonymized report data from multiple patient records.
Answer the researcher's questions concisely and clearly, ensuring that no confidential patient details are revealed.
If the provided context does not supply enough information, indicate that the data may be incomplete.

**Aggregated Data:**
{aggregated_context}

**Researcher's Query:**
{query}

**Assistant's Answer:**
"""

prompt = ChatPromptTemplate.from_template(researcher_prompt_template)

@app.post("/rag")
async def rag_researcher(request: ResearcherRAGRequest):
    if not request.query or not request.aggregated_context:
        raise HTTPException(status_code=400, detail="Both 'query' and 'aggregated_context' are required.")
    
    # Build the complete prompt.
    full_prompt = prompt.format(query=request.query, aggregated_context=request.aggregated_context)
    
    try:
        # Generate an answer using the Gemini LLM.
        response = llm.call(full_prompt)
        time.sleep(1)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during generation: {e}")

# To run this service, use: uvicorn rag_researcher:app --port 5002 --reload
