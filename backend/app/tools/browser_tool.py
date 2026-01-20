import time
import os
from playwright.sync_api import sync_playwright
from langchain_core.tools import tool

class BrowserManager:
    def navigate(self, url: str):
        with sync_playwright() as p:
            # Launch browser in headless mode for seamless background operation
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            # --- 1. SET UP LISTENERS ( The Ears ) ---
            console_logs = []
            page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
            
            network_errors = []
            page.on("requestfailed", lambda req: network_errors.append(f"{req.url} ({req.failure})"))

            try:
                print(f"🌎 Navigating to: {url}")
                start_time = time.time()
                
                # Visit the page
                response = page.goto(url, timeout=15000)
                load_time = round(time.time() - start_time, 2)
                
                # --- 2. GATHER DATA ( The Eyes ) ---
                status = response.status if response else "Unknown"
                title = page.title()
                content = page.inner_text("body")[:1000] # First 1000 chars
                
                # Clean up logs
                error_report = "\n".join(console_logs[:5]) if console_logs else "✅ No Console Errors"
                network_report = "\n".join(network_errors[:5]) if network_errors else "✅ No Network Failures"
                
                # --- 3. THE QA REPORT ---
                return f"""
                ---- TECHNICAL QA REPORT ----
                🔗 URL: {url}
                ⏱️ Load Time: {load_time}s
                🚦 Status Code: {status}
                📑 Page Title: {title}
                
                🚨 CONSOLE ERRORS:
                {error_report}
                
                🌐 NETWORK FAILURES:
                {network_report}
                
                📝 CONTENT PREVIEW:
                {content}...
                """
            
            except Exception as e:
                return f"❌ CRITICAL ERROR visiting {url}: {e}"
            finally:
                browser.close()

    def snapshot(self, url: str):
        """Visits a page and takes a screenshot."""
        with sync_playwright() as p:
            # Headless=True is faster for screenshots
            browser = p.chromium.launch(headless=True) 
            page = browser.new_page()
            
            try:
                print(f"📸 Snapping picture of: {url}")
                page.goto(url, timeout=15000)
                
                # Generate a unique filename based on time
                filename = f"screenshot_{int(time.time())}.png"
                filepath = f"static/{filename}"
                
                # Take the screenshot (full page)
                page.screenshot(path=filepath, full_page=False)
                
                # Return the URL that the Frontend can use
                # Use environment variable for base URL in production
                base_url = os.getenv("BASE_URL", "http://localhost:8000")
                return f"{base_url}/static/{filename}"
            
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"❌ Screenshot Error: {e}")
                print(f"Full traceback:\n{error_details}")
                return f"Error taking screenshot: {e}\n{error_details}"
            finally:
                browser.close()

browser_manager = BrowserManager()

@tool
def visit_page(url: str):
    """
    Visits a page and returns a Technical QA Report including load time, 
    console errors, and network failures. Use this for all site visits.
    """
    return browser_manager.navigate(url)

@tool
def take_screenshot(url: str):
    """
    Takes a full-page screenshot of a website. 
    Use this when you find a bug or want to visually verify the page.
    Returns a URL to the image.
    """
    return browser_manager.snapshot(url)

# Export the list
tools = [visit_page, take_screenshot]