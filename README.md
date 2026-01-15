# 🤖 AutoQA Agent

An intelligent, AI-powered Quality Assurance automation tool that uses LangGraph and Groq AI to perform comprehensive website testing, including page analysis, broken link detection, and visual screenshot capture.

## ✨ Features

- **🌐 Automated Web Testing**: Navigate and analyze web pages automatically
- **🔗 Broken Link Detection**: Scan and identify broken links on any website
- **📸 Screenshot Capture**: Take and serve screenshots of web pages for visual verification
- **🤖 AI-Powered Agent**: Uses Groq's LLaMA model to intelligently orchestrate QA tasks
- **⚡ Real-time API**: FastAPI backend with CORS support for seamless integration
- **🎨 Modern Frontend**: Next.js-based user interface with TypeScript and Tailwind CSS
- **🔧 Tool-based Architecture**: Extensible design using LangChain tools

## 🏗️ Architecture

The project follows a modular architecture with:
- **Backend**: FastAPI server with LangGraph agent orchestration
- **Frontend**: Next.js application for user interaction
- **AI Engine**: Groq LLaMA 3.3 70B model for intelligent decision-making
- **Browser Automation**: Playwright for web interaction and testing

## 📁 Project Structure

```
AutoQA_Agent/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── static/                    # Stored screenshots
│   ├── app/
│   │   ├── agent/
│   │   │   └── graph.py          # LangGraph agent definition
│   │   └── tools/
│   │       ├── browser_tool.py   # Web navigation & screenshot tools
│   │       └── link_tool.py      # Broken link checker
│   └── .env                       # Environment variables (not in repo)
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main application page
│   │   ├── layout.tsx            # App layout
│   │   └── globals.css           # Global styles
│   ├── package.json              # Frontend dependencies
│   └── next.config.ts            # Next.js configuration
└── README.md                      # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - Agent orchestration framework
- **LangChain** - LLM application framework
- **Groq** - AI inference engine (LLaMA 3.3 70B)
- **Playwright** - Browser automation
- **Python-dotenv** - Environment variable management

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React 19** - UI library

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com))

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/farazmirzax/AutoQA-Agent.git
   cd AutoQA_Agent
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install fastapi uvicorn langchain-groq langgraph langchain-core playwright python-dotenv
   playwright install chromium
   ```

5. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

6. **Create static directory**
   ```bash
   mkdir static
   ```

7. **Run the backend server**
   ```bash
   uvicorn main:app --reload
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### POST `/chat`

Send a query to the AutoQA Agent.

**Request Body:**
```json
{
  "query": "Check the homepage of example.com for broken links"
}
```

**Response:**
```json
{
  "response": "Analysis complete. Found 2 broken links on the page..."
}
```

### Static Files

Screenshots are served from `/static/` directory and can be accessed at:
```
http://localhost:8000/static/screenshot_<timestamp>.png
```

## 🔧 Available Tools

The AI agent has access to the following tools:

### 1. `visit_page`
Navigates to a URL and performs comprehensive analysis:
- Page load time
- HTTP status code
- Page title
- Console errors
- Network failures
- Element counts (images, forms, iframes)

### 2. `check_page_links`
Scans a website for broken links:
- Extracts all links from the page
- Tests each link for accessibility
- Reports broken links with status codes

### 3. `take_screenshot`
Captures a screenshot of a webpage:
- Saves to the `static` directory
- Returns a URL to access the screenshot
- Useful for visual regression testing

## 💡 Usage Examples

### Example 1: Page Analysis
```
Query: "Visit https://example.com and analyze the page"
```
The agent will navigate to the URL and provide insights about load time, errors, and page structure.

### Example 2: Broken Link Check
```
Query: "Check all links on https://example.com"
```
The agent will scan the page and report any broken or inaccessible links.

### Example 3: Visual Testing
```
Query: "Take a screenshot of https://example.com"
```
The agent will capture and provide a URL to view the screenshot.

### Example 4: Combined Testing
```
Query: "Test https://example.com - check for broken links and take a screenshot"
```
The agent will intelligently use multiple tools to complete the comprehensive test.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Security Notes

- Never commit your `.env` file or expose your API keys
- The `.gitignore` is configured to exclude sensitive files
- Regenerate API keys immediately if accidentally exposed

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Use a different port
uvicorn main:app --reload --port 8001
```

**Playwright browser not found:**
```bash
playwright install chromium
```

### Frontend Issues

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- [LangGraph](https://github.com/langchain-ai/langgraph) for agent orchestration
- [Groq](https://groq.com/) for AI inference
- [Playwright](https://playwright.dev/) for browser automation
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework

---

Made with ❤️ for automated QA testing
