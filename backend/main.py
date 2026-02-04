import sys
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

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
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class Request(BaseModel):
    query: str
    history: list[ChatMessage] = []  # Previous conversation messages

# 5. Define the Streaming Endpoint
@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Send a message to the QA Agent with streaming progress updates.
    """
    print(f"📩 Received Query: {request.query}")
    print(f"📜 Conversation History: {len(request.history)} messages")
    for i, msg in enumerate(request.history):
        print(f"   [{i}] {msg.role}: {msg.content[:50]}...")
    
    async def event_generator():
        try:
            # STRICT SYSTEM PROMPT
            system_instructions = """You are an expert QA Engineer.
            Your goal is to complete the user's request efficiently.
            
            RULES:
            1. If asked to check a site, use the necessary tools ONE TIME.
            2. DO NOT mention screenshots or URLs until you have actually received them from the tool.
            3. DO NOT run the same tool twice on the same URL unless the first attempt failed.
            4. CRITICAL: Format your response properly:
               - Only mention the screenshot URL AFTER you receive it from the take_screenshot tool
               - Include it naturally in your final analysis (e.g., "You can view the screenshot here: [URL]")
               - End with "Final Answer:" followed by a summary and recommendations
            5. DO NOT say "The screenshot URL is:" or mention screenshots before taking them.
            6. When the user asks follow-up questions about a site you already tested, use your memory of the previous conversation to answer. DO NOT re-test the site unless explicitly asked.
            7. If you need to reference a site from earlier in the conversation, use the URL from the previous context.
            """
            
            system_prompt = SystemMessage(content=system_instructions)
            
            # Build messages list with conversation history
            messages = [system_prompt]
            
            # Add conversation history
            for msg in request.history:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))
            
            # Add current query
            messages.append(HumanMessage(content=request.query))
            
            # Stream the Graph execution
            for event in graph.stream({"messages": messages}, stream_mode="values"):
                last_msg = event["messages"][-1]
                
                # If it's a Tool Call (agent deciding to use a tool)
                if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
                    tool_name = last_msg.tool_calls[0]['name']
                    tool_args = last_msg.tool_calls[0].get('args', {})
                    url = tool_args.get('url', '')
                    
                    # Send progress update based on tool
                    if tool_name == 'visit_page':
                        progress_msg = f"🌐 Opening {url}..."
                    elif tool_name == 'check_page_links':
                        progress_msg = f"🔗 Scanning links on {url}..."
                    elif tool_name == 'take_screenshot':
                        progress_msg = f"📸 Taking screenshot of {url}..."
                    else:
                        progress_msg = f"🛠️ Using {tool_name}..."
                    
                    yield f"data: {json.dumps({'type': 'progress', 'content': progress_msg})}\n\n"
                
                # If it's a Tool Message (result from tool execution)
                elif last_msg.type == 'tool':
                    yield f"data: {json.dumps({'type': 'progress', 'content': '✅ Completed'})}\n\n"
                
                # If it's the final AI response
                elif last_msg.type == 'ai' and not last_msg.tool_calls:
                    yield f"data: {json.dumps({'type': 'final', 'content': last_msg.content})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            print(f"❌ Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)