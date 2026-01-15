from playwright.sync_api import sync_playwright
from langchain_core.tools import tool

class BrowserManager:
    """
    A persistent browser manager. 
    In a real app, you'd keep this open across steps.
    For now, we open/close per action for simplicity.
    """
    def navigate(self, url: str):
        with sync_playwright() as p:
            # We launch 'headless=False' so you can SEE the bot working!
            # Change to True later for speed.
            browser = p.chromium.launch(headless=False, slow_mo=500) 
            page = browser.new_page()
            
            try:
                print(f"🌎 Navigating to: {url}")
                page.goto(url, timeout=10000)
                
                # Get the page title
                title = page.title()
                
                # Get the visible text (cleaner than raw HTML)
                # We only take the first 500 characters to keep the LLM fast
                content = page.inner_text("body")[:1000] 
                
                return f"Title: {title}\n\nContent Preview:\n{content}..."
            
            except Exception as e:
                return f"Error visiting {url}: {e}"
            finally:
                browser.close()

# Initialize the manager
browser_manager = BrowserManager()

# Wrap it as a LangChain Tool
@tool
def visit_page(url: str):
    """
    Visits a website using a real browser.
    Useful for checking if a site is up, reading content, or finding bugs.
    """
    return browser_manager.navigate(url)

# This list will be imported by our Agent
tools = [visit_page]