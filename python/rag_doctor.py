# python/rag_doctor.py
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

app = FastAPI(title="Doctor RAG Service")

# --- Configuration ---
GOOGLE_GEMINI_API_KEY = "AIzaSyDU8mIzLFSiCvGVXqfNwDa4v0FN6NvGBg4"  # Replace with your actual API key

# Initialize the Gemini LLM instance for doctors.
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

# Define the Pydantic model for doctor requests.
class DoctorRAGRequest(BaseModel):
    query: str
    report: str  # The full patient report text

# Doctor prompt template modeled after your previous format.
doctor_prompt_template = """
You are a helpful AI assistant collaborating with a medical professional.
You have access to relevant sections of a patient's medical report based on the current conversation topic.
Answer the doctor's questions concisely and clearly, referencing the report context when necessary.
Maintain a conversational and collaborative tone. If the context is missing information to answer, state that clearly.

**Patient Report:**
{report}

**Doctor's Query:**
{query}

**Assistant's Answer:**
"""

prompt = ChatPromptTemplate.from_template(doctor_prompt_template)

@app.post("/rag")
async def rag_doctor(request: DoctorRAGRequest):
    if not request.query or not request.report:
        raise HTTPException(status_code=400, detail="Both 'query' and 'report' are required.")
    
    # Build the complete prompt.
    full_prompt = prompt.format(query=request.query, report=request.report)
    
    try:
        # Generate an answer using the Gemini LLM.
        response = llm.call(full_prompt)
        # Optional simulated delay.
        time.sleep(1)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during generation: {e}")

# To run this service, use: uvicorn rag_doctor:app --port 5001 --reload
