import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage

# Ensure we can find the app module
sys.path.append(os.getcwd())
from app.agent.graph import graph

# 1. Setup FastAPI
app = FastAPI(title="AutoQA Agent API", version="1.0")

# 2. Configure CORS (The Permission Slip)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allows ALL origins (Frontend, Postman, etc.)
    allow_credentials=True,
    allow_methods=["*"],      # Allows ALL methods
    allow_headers=["*"],      # Allows ALL headers
)

# 3. Define the Request Format
class Request(BaseModel):
    query: str

# 4. Define the Endpoint
@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Send a message to the QA Agent.
    """
    print(f"📩 Received Query: {request.query}")
    
    try:
        # STRICTER SYSTEM PROMPT (Fixes the Loop)
        system_instructions = """You are an expert QA Engineer.
        Your goal is to complete the user's request efficiently.
        
        RULES:
        1. If asked to check a site, use the necessary tools ONE TIME.
        2. Once you receive the tool output, analyze it and provide your Final Answer immediately.
        3. DO NOT run the same tool twice on the same URL unless the first attempt failed.
        4. If you have the page title and the link report, stop working and report the results.
        """
        
        system_prompt = SystemMessage(content=system_instructions)
        messages = [system_prompt, HumanMessage(content=request.query)]
        
        # Run the Graph
        # invoke() runs until the graph hits the 'END' node
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