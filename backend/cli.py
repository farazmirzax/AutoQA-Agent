import sys
import os

# Ensure Python can find the 'app' module
sys.path.append(os.getcwd())

from langchain_core.messages import HumanMessage, SystemMessage
from app.agent.graph import graph

def main():
    print("🐞 AutoQA Agent V1 (Professional Edition)")
    print("-----------------------------------------")
    print("Type 'quit' to exit.")

    # The System Prompt (Who the agent is)
    system_prompt = SystemMessage(
        content="""You are an expert QA Engineer. 
        Your job is to test websites using your browser tool.
        When asked to test a site, visit it, read the content, and report any issues or summary."""
    )

    while True:
        user_input = input("\nRequest: ")
        if user_input.lower() in ["quit", "exit"]:
            break

        print("\n⏳ Agent is thinking...")
        
        # Initial State
        messages = [system_prompt, HumanMessage(content=user_input)]
        
        # Run the Graph
        # stream_mode="values" returns the full list of messages at every step
        for event in graph.stream({"messages": messages}, stream_mode="values"):
            # We print the last message from the last event
            last_msg = event["messages"][-1]
            
            # If it's a Tool Call (The "Request" to run code)
            if hasattr(last_msg, 'tool_calls') and last_msg.tool_calls:
                print(f"🛠️  Decided to use tool: {last_msg.tool_calls[0]['name']}")
            
            # If it's a Tool Message (The "Result" of the code)
            elif last_msg.type == 'tool':
                print(f"👀 Tool Output received.")
                
            # If it's a final AI Message
            elif last_msg.type == 'ai':
                # We only print the text if it's not a tool call request
                if not last_msg.tool_calls:
                    print(f"\n🤖 Agent: {last_msg.content}")

if __name__ == "__main__":
    main()