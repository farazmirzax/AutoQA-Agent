import os
from dotenv import load_dotenv

# LangGraph & LangChain imports
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage

# --- UPDATED IMPORTS HERE ---
# Import the specific tool functions, not the lists
from app.tools.browser_tool import visit_page
from app.tools.link_tool import check_page_links

# 1. Load Environment
load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found in .env")

# --- UPDATED TOOLS LIST HERE ---
# Combine all your tools into one list for the Agent
tools = [visit_page, check_page_links]

# 2. Setup the LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

# Bind the tools to the LLM
llm_with_tools = llm.bind_tools(tools)

# 3. Define the Agent Node
def agent_node(state: MessagesState):
    """
    Invokes the LLM with the current conversation history.
    The LLM will return either a text response OR a 'tool_call'.
    """
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

# 4. Define the Logic
def should_continue(state: MessagesState):
    """
    Checks if the last message was a tool call.
    """
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

# 5. Build the Graph
builder = StateGraph(MessagesState)

builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode(tools)) 

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, ["tools", END])
builder.add_edge("tools", "agent")

graph = builder.compile()



