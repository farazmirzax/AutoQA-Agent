import sys
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage

# Ensure we can find the app module
sys.path.append(os.getcwd())
from app.agent.graph import graph

# 1. Setup FastAPI
app = FastAPI(title="AutoQA Agent API", version="1.0")

# 2. Define the Request Format
class Request(BaseModel):
    query: str

# 3. Define the Endpoint
@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Send a message to the QA Agent.
    Example Query: "Check https://example.com for broken links"
    """
    print(f"📩 Received Query: {request.query}")
    
    try:
        # Initial State
        system_prompt = SystemMessage(content="You are an expert QA Engineer. Test websites thoroughly.")
        messages = [system_prompt, HumanMessage(content=request.query)]
        
        # Run the Graph (Synchronously for now, keep it simple)
        # We invoke() instead of stream() to get the final result in one go
        result = graph.invoke({"messages": messages})
        
        # Extract the final response from the agent
        final_message = result["messages"][-1].content
        
        return {"response": final_message}

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. Run Server (If run directly)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)