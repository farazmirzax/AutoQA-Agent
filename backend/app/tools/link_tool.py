from playwright.sync_api import sync_playwright
from langchain_core.tools import tool
from urllib.parse import urljoin

@tool
def check_page_links(url: str):
    """
    Scans a website for broken links. 
    It finds all <a> tags and checks if they return a 200 OK status.
    Returns a report of broken links found.
    """
    report = []
    broken_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Headless is faster for scanning
        page = browser.new_page()
        
        try:
            print(f"🕵️ Scanning links on: {url}")
            page.goto(url, timeout=15000)
            
            # Get all links on the page
            links = page.evaluate("""
                Array.from(document.querySelectorAll('a')).map(a => a.href)
            """)
            
            # Filter out empty links or javascript: calls
            valid_links = [link for link in links if link.startswith('http')]
            unique_links = list(set(valid_links))[:20] # Limit to 20 for speed in testing
            
            report.append(f"Found {len(unique_links)} unique links. Testing them now...")
            
            for link in unique_links:
                try:
                    # We use a separate request context to check the link quickly without navigating
                    response = page.request.get(link)
                    if response.status >= 400:
                        report.append(f"❌ BROKEN: {link} (Status: {response.status})")
                        broken_count += 1
                    else:
                        # Optional: Don't log successes to keep output clean
                        pass 
                except Exception as e:
                    report.append(f"⚠️ ERROR: {link} ({str(e)})")
                    broken_count += 1
            
            if broken_count == 0:
                return "✅ No broken links found on this page!"
            else:
                return "\n".join(report)

        except Exception as e:
            return f"Error scanning page: {e}"
        finally:
            browser.close()