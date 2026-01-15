import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from langchain_core.tools import tool

# This header makes the request look like a real Chrome browser on Windows
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
}

def get_all_links(url: str):
    """Scrapes all links from a webpage."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = set()
        base_domain = urlparse(url).netloc

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(url, href)
            parsed_url = urlparse(full_url)

            # Filter out empty links, mailto:, javascript:, and anchors
            if not parsed_url.scheme or parsed_url.scheme not in ['http', 'https']:
                continue
            
            # Optimization: Only check links that look valid
            links.add(full_url)

        return list(links)
    except Exception as e:
        return f"Error scraping links: {str(e)}"

def check_link_status(url: str):
    """Checks if a single URL is broken."""
    try:
        # Try a HEAD request first (faster, doesn't download body)
        response = requests.head(url, headers=HEADERS, timeout=5, allow_redirects=True)
        
        # 405 (Method Not Allowed) or 999 (LinkedIn Block) -> Retry with GET
        if response.status_code in [405, 999, 403]:
            response = requests.get(url, headers=HEADERS, timeout=5)
            
        if response.status_code >= 400:
            # 999 is specifically LinkedIn/Anti-bot, usually means the link exists but we are blocked
            if response.status_code == 999:
                return f"{url} (Status: 999 - Anti-Bot Blocked, likely valid)"
            return f"{url} (Status: {response.status_code})"
            
        return None # Link is Good
    except requests.exceptions.RequestException:
        return f"{url} (Connection Error)"

@tool
def check_page_links(url: str):
    """
    Scans a webpage for all links and checks if any are broken (404, 500, etc.).
    Returns a list of broken links.
    """
    print(f"🕵️ Scanning links on: {url}")
    
    links = get_all_links(url)
    if isinstance(links, str):
        return links # Return error message if scraping failed

    # Limit to first 20 links to prevent the Agent from waiting too long
    # (You can increase this number if you want a deeper scan)
    links_to_check = links[:20] 
    
    broken_links = []
    
    for link in links_to_check:
        status = check_link_status(link)
        if status:
            broken_links.append(status)

    if not broken_links:
        return f"✅ Scanned {len(links_to_check)} links. No broken links found!"
    
    return f"⚠️ Found {len(broken_links)} broken or blocked links:\n" + "\n".join(broken_links)