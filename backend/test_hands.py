import sys
import os

# 1. Add the current directory to Python path so it can find the 'app' folder
sys.path.append(os.getcwd())

# 2. Import the tool from the new location
from app.tools.browser_tool import visit_page

# 3. Run the test
print("🤖 Testing Browser Capabilities...")
print("--------------------------------")

try:
    # We invoke the tool with a simple URL
    result = visit_page.invoke("https://example.com")
    
    print("\n✅ SUCCESS! Here is what the bot saw:\n")
    print(result)

except Exception as e:
    print(f"\n❌ ERROR: {e}")