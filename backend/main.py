import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <--- NEW IMPORT
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage

# Ensure we can find the app module
sys.path.append(os.getcwd())
from app.agent.graph import graph

# 1. Setup FastAPI
app = FastAPI(title="AutoQA Agent API", version="1.0")

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount the Static Folder (The Gallery)
# Make sure the 'static' folder exists in your backend directory!
app.mount("/static", StaticFiles(directory="static"), name="static")

# 4. Define the Request Format
class Request(BaseModel):
    query: str

# 5. Define the Endpoint
@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Send a message to the QA Agent.
    """
    print(f"📩 Received Query: {request.query}")
    
    try:
        # STRICT SYSTEM PROMPT
        system_instructions = """You are an expert QA Engineer.
        Your goal is to complete the user's request efficiently.
        
        RULES:
        1. If asked to check a site, use the necessary tools ONE TIME.
        2. Once you receive the tool output, analyze it and provide your Final Answer immediately.
        3. DO NOT run the same tool twice on the same URL unless the first attempt failed.
        4. CRITICAL: Format your response properly:
           - Start with your analysis of the findings
           - Include the screenshot URL naturally in your analysis (e.g., "You can view the screenshot here: [URL]")
           - End with "Final Answer:" followed by a summary and recommendations
        5. DO NOT put placeholder text like "The screenshot URL is:" - integrate it naturally into your response.
        """
        
        system_prompt = SystemMessage(content=system_instructions)
        messages = [system_prompt, HumanMessage(content=request.query)]
        
        # Run the Graph
        result = graph.invoke({"messages": messages})
        
        # Extract the final response from the agent
        final_message = result["messages"][-1].content
        
        return {"response": final_message}

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)