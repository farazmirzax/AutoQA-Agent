# 🏗️ AutoQA Agent - Architecture & Technical Documentation

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [File Structure & Connections](#file-structure--connections)
- [Technology Stack Deep Dive](#technology-stack-deep-dive)
- [Data Flow](#data-flow)
- [Component Interactions](#component-interactions)
- [Design Decisions](#design-decisions)

---

## 🎯 System Overview

AutoQA Agent is an **AI-powered web testing platform** that combines modern web technologies with artificial intelligence to automate quality assurance tasks. The system uses an agentic architecture where an AI agent autonomously decides which tools to use based on user requests.

### Core Capabilities
- 🌐 **Automated Web Navigation**: Visit websites and extract technical metrics
- 🔗 **Broken Link Detection**: Scan and identify non-functional links
- 📸 **Screenshot Capture**: Visual verification of web pages
- 🤖 **Intelligent Orchestration**: AI decides which tools to use and when

---

## 🗺️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js Frontend - Port 3000)               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  page.tsx    │  │  layout.tsx  │  │  globals.css        │  │
│  │ (UI Logic)   │  │ (App Shell)  │  │ (Tailwind Styles)   │  │
│  └──────┬───────┘  └──────────────┘  └─────────────────────┘  │
└─────────┼──────────────────────────────────────────────────────┘
          │ HTTP POST /chat (Axios)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│                (FastAPI Backend - Port 8000)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  main.py - API Server                                    │  │
│  │  • /chat endpoint                                        │  │
│  │  • /static file serving                                  │  │
│  │  • CORS middleware                                       │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │ Invokes with system prompt
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                    │
│                    (LangGraph - graph.py)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  StateGraph with MessagesState                           │  │
│  │  ┌────────┐        ┌─────────┐        ┌──────────────┐  │  │
│  │  │ START  │───────▶│  Agent  │───────▶│  Should      │  │  │
│  │  │        │        │  Node   │        │  Continue?   │  │  │
│  │  └────────┘        └────┬────┘        └──────┬───────┘  │  │
│  │                         │                     │          │  │
│  │                         │        ┌────────────┼────┐     │  │
│  │                         │        │            │    │     │  │
│  │                         │        │ Yes        │ No │     │  │
│  │                         │        ▼            ▼    │     │  │
│  │                    ┌────┴─────┐         ┌────────┐│     │  │
│  │                    │   Tools  │         │  END   ││     │  │
│  │                    │   Node   │         └────────┘│     │  │
│  │                    └────┬─────┘                   │     │  │
│  │                         │                         │     │  │
│  │                         └─────────────────────────┘     │  │
│  │                      (Loops back to Agent)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Powered by: Groq LLaMA 3.3 70B                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Executes tool calls
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        TOOLS LAYER                              │
│                   (Python LangChain Tools)                      │
│  ┌───────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ browser_tool.py   │  │  link_tool.py    │  │   static/   │ │
│  │                   │  │                  │  │ (Storage)   │ │
│  │ • visit_page()    │  │ • check_page_    │  │             │ │
│  │   - Playwright    │  │   links()        │  │ Screenshots │ │
│  │   - Console logs  │  │   - Requests lib │  │   *.png     │ │
│  │   - Network       │  │   - BeautifulSoup│  │             │ │
│  │   - Performance   │  │   - HEAD/GET     │  │             │ │
│  │                   │  │   - Status codes │  │             │ │
│  │ • take_screenshot │  │                  │  │             │ │
│  │   - Playwright    │  │                  │  │             │ │
│  │   - Saves to      │  │                  │  │             │ │
│  │     static/       │  │                  │  │             │ │
│  └───────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
              External Websites
```

---

## 📂 File Structure & Connections

### **Backend** (`backend/`)

#### 1. **`main.py`** - API Server & Entry Point
**Purpose**: FastAPI application that serves as the HTTP interface

**Key Responsibilities**:
- Exposes `/chat` POST endpoint for receiving user queries
- Serves static files (screenshots) via `/static` route
- Manages CORS to allow frontend connections
- Injects system prompt into agent requests
- Returns agent responses to frontend

**Connections**:
```python
main.py
├── imports: graph.py (the compiled agent graph)
├── calls: graph.invoke() with user messages
├── serves: static/ directory for screenshot access
└── receives HTTP from: frontend/app/page.tsx
```

**Why FastAPI?**
- ⚡ **Fast**: Built on ASGI (async support)
- 📝 **Type-safe**: Automatic request/response validation with Pydantic
- 🔧 **Simple**: Easy CORS setup and static file serving
- 📚 **Auto-docs**: Built-in Swagger UI for API testing

---

#### 2. **`app/agent/graph.py`** - Agent Orchestration
**Purpose**: Defines the LangGraph agent's decision-making flow

**Key Responsibilities**:
- Initializes Groq LLM with tool-calling capabilities
- Defines the agent's state machine (graph)
- Implements decision logic (should_continue)
- Routes between agent thinking and tool execution

**Connections**:
```python
graph.py
├── imports: browser_tool.py (visit_page, take_screenshot)
├── imports: link_tool.py (check_page_links)
├── configures: ChatGroq (Groq AI client)
├── builds: StateGraph with MessagesState
└── exports: compiled graph → used by main.py
```

**Why LangGraph?**
- 🔄 **Stateful**: Manages conversation context across multiple steps
- 🎯 **Controllable**: Explicit flow control vs. pure ReAct loops
- 🛠️ **Tool-calling**: Native support for LangChain tools
- 🔁 **Cyclic graphs**: Agent can loop back after tool execution
- 📊 **Debuggable**: Clear visualization of agent's decision path

**Graph Flow Explained**:
1. **START** → User message enters the graph
2. **Agent Node** → LLM decides: answer directly OR call tools
3. **Should Continue?** → Check if `tool_calls` exist in response
   - If **YES** → Route to **Tools Node**
   - If **NO** → Route to **END** (final answer ready)
4. **Tools Node** → Execute requested tools (visit_page, check_page_links, etc.)
5. **Loop back** → Return to Agent Node with tool results
6. **END** → Agent provides final answer based on tool outputs

---

#### 3. **`app/tools/browser_tool.py`** - Browser Automation
**Purpose**: Web navigation and screenshot capture using Playwright

**Key Responsibilities**:
- Launches headless Chrome browser
- Monitors console errors and network failures
- Measures page load times
- Captures full-page screenshots
- Saves screenshots to `static/` directory

**Connections**:
```python
browser_tool.py
├── uses: Playwright (Chromium driver)
├── exports: visit_page() → registered in graph.py
├── exports: take_screenshot() → registered in graph.py
└── writes to: static/screenshot_*.png
```

**Why Playwright?**
- 🎭 **Real browser**: Chromium rendering (accurate to production)
- 🔊 **Event listeners**: Capture console errors, network failures
- 📸 **Screenshots**: Built-in full-page capture
- ⚡ **Fast**: Headless mode for speed
- 🐍 **Python-native**: Synchronous API for simplicity

**Tool Functions**:
1. **`visit_page(url)`**:
   - Navigates to URL with 15s timeout
   - Collects: load time, status code, title, content preview
   - Monitors: console errors, failed network requests
   - Returns: Formatted QA report string

2. **`take_screenshot(url)`**:
   - Opens browser in headless mode (faster)
   - Navigates to URL
   - Captures viewport screenshot
   - Saves as `screenshot_{timestamp}.png`
   - Returns: `http://localhost:8000/static/{filename}`

---

#### 4. **`app/tools/link_tool.py`** - Link Validation
**Purpose**: Scrapes and validates all links on a webpage

**Key Responsibilities**:
- Extracts all `<a>` tags from HTML
- Converts relative URLs to absolute URLs
- Tests each link with HEAD/GET requests
- Identifies broken links (4xx, 5xx status codes)
- Handles anti-bot protections (e.g., LinkedIn 999)

**Connections**:
```python
link_tool.py
├── uses: Requests (HTTP client)
├── uses: BeautifulSoup4 (HTML parser)
├── exports: check_page_links() → registered in graph.py
└── calls: external URLs via HTTP
```

**Why Requests + BeautifulSoup?**
- 🚀 **Lightweight**: No browser overhead for link checking
- 🔍 **Parser**: BeautifulSoup handles malformed HTML gracefully
- 🎯 **HEAD first**: Checks status without downloading content
- 🤖 **User-Agent spoofing**: Bypasses basic bot detection
- ⚡ **Fast**: Parallel-ready (can be extended)

**Tool Logic**:
1. **`get_all_links(url)`**:
   - Fetches HTML with fake User-Agent
   - Parses with BeautifulSoup
   - Extracts `href` attributes
   - Filters out `mailto:`, `javascript:`, etc.
   - Returns list of HTTP(S) URLs

2. **`check_link_status(url)`**:
   - Tries HEAD request first (faster)
   - Falls back to GET if 405/403/999
   - Returns error string if broken, else None

3. **`check_page_links(url)`** (main tool):
   - Gets all links from page
   - Checks first 20 links (optimization)
   - Returns summary of broken links

---

#### 5. **`static/`** - Screenshot Storage
**Purpose**: File storage for generated screenshots

**Connections**:
```
static/
├── written by: browser_tool.py (take_screenshot)
├── served by: main.py (/static route)
└── accessed by: frontend (image URLs in chat)
```

**Why local storage?**
- 🗃️ **Simple**: No external dependencies (S3, etc.)
- 🚀 **Fast**: Served directly by FastAPI
- 🔒 **Temporary**: Screenshots can be cleaned up later
- 🧪 **Dev-friendly**: Easy to inspect files manually

---

### **Frontend** (`frontend/`)

#### 6. **`app/page.tsx`** - Main UI Component
**Purpose**: Chat interface for user interaction

**Key Responsibilities**:
- Manages chat history state
- Sends API requests to backend
- Parses agent responses (text + images)
- Handles dark mode, test history, loading states
- Auto-scrolls to latest messages

**Connections**:
```typescript
page.tsx
├── imports: axios (HTTP client)
├── imports: React hooks (useState, useEffect, useRef)
├── calls: POST http://localhost:8000/chat
├── renders: chat messages with timestamps
└── detects: screenshot URLs in responses
```

**Why Next.js + React 19?**
- ⚛️ **Reactive**: State updates trigger re-renders automatically
- 🎣 **Hooks**: Clean state management with useState/useEffect
- 🚀 **SSR-ready**: Next.js enables server-side rendering (future scaling)
- 📦 **Zero-config**: Built-in TypeScript, routing, optimization

**State Management**:
- `chatHistory`: Array of messages (sender, text, timestamp, isImage)
- `loading`: Boolean for "thinking..." spinner
- `darkMode`: UI theme preference (stored in localStorage)
- `testHistory`: Last 10 queries (stored in localStorage)

**Smart Response Parsing**:
```typescript
// Regex to detect screenshot URLs
const imageRegex = /(http:\/\/localhost:8000\/static\/screenshot_[a-zA-Z0-9_]+\.png)/;
const match = responseText.match(imageRegex);

if (match) {
  // Split text and image into separate messages
  const imageUrl = match[0];
  const cleanText = responseText.replace(imageUrl, "").trim();
  
  // Render text first, then image
  setChatHistory([...prev, textMessage, imageMessage]);
}
```

---

#### 7. **`app/layout.tsx`** - App Shell
**Purpose**: Root layout wrapper for all pages

**Key Responsibilities**:
- Loads custom fonts (Geist Sans/Mono)
- Sets metadata (title, description, icons)
- Wraps children with HTML/body tags

**Connections**:
```typescript
layout.tsx
├── imports: globals.css (Tailwind styles)
├── wraps: page.tsx (all routes)
└── configures: metadata for SEO
```

**Why this structure?**
- 📄 **Next.js convention**: layout.tsx is required
- 🎨 **Global styles**: Fonts and CSS apply to entire app
- 🔍 **SEO**: Metadata improves search engine discoverability

---

#### 8. **`globals.css`** - Tailwind Styles
**Purpose**: Global CSS with Tailwind directives

**Key Responsibilities**:
- Imports Tailwind base, components, utilities
- Defines dark mode color scheme
- Sets font variables

**Connections**:
```css
globals.css
├── imported by: layout.tsx
├── uses: Tailwind CSS (postcss.config.mjs)
└── applies to: all components
```

**Why Tailwind CSS?**
- ⚡ **Fast development**: Utility classes (no custom CSS)
- 🎨 **Consistent**: Design tokens for colors, spacing
- 🌓 **Dark mode**: Built-in class-based dark mode
- 📦 **Tree-shakeable**: Only used classes are bundled

---

#### 9. **`package.json`** - Frontend Dependencies
**Purpose**: Node.js project configuration

**Key Dependencies**:
- **next**: Framework (SSR, routing, optimization)
- **react**: UI library
- **axios**: HTTP client (vs. fetch for better error handling)
- **tailwindcss**: Utility-first CSS
- **typescript**: Type safety

**Scripts**:
- `npm run dev`: Starts dev server on port 3000
- `npm run build`: Production build
- `npm start`: Runs production server

---

## 🔄 Data Flow: User Query to Agent Response

### Step-by-Step Flow

```
1. USER TYPES QUERY
   └─▶ "Check https://example.com for broken links"
        │
        ▼
   
2. FRONTEND (page.tsx)
   ├─▶ User clicks send
   ├─▶ Add user message to chatHistory (UI update)
   ├─▶ Set loading = true (show spinner)
   └─▶ POST /chat with { query: "..." }
        │
        ▼

3. API SERVER (main.py)
   ├─▶ Receive request at /chat endpoint
   ├─▶ Inject system prompt (agent instructions)
   ├─▶ Build messages = [SystemMessage, HumanMessage]
   └─▶ Call graph.invoke({"messages": messages})
        │
        ▼

4. AGENT ORCHESTRATION (graph.py)
   ┌─────────────────────────────────────────────┐
   │ CYCLE 1: Initial Decision                   │
   ├─────────────────────────────────────────────┤
   │ • Agent Node receives messages              │
   │ • LLM analyzes query: "broken links"        │
   │ • Decision: Need check_page_links tool      │
   │ • Returns: AIMessage with tool_calls        │
   │ • should_continue() → "tools"               │
   ├─────────────────────────────────────────────┤
   │ → Tools Node                                │
   │   ├─▶ Execute check_page_links(url)         │
   │   │   ├─▶ Scrape page with Requests         │
   │   │   ├─▶ Parse HTML with BeautifulSoup     │
   │   │   ├─▶ Test links with HEAD requests     │
   │   │   └─▶ Return: "Found 3 broken links..." │
   │   └─▶ Add ToolMessage to state              │
   └─────────────────────────────────────────────┘
        │
        ▼ (loop back)
        
   ┌─────────────────────────────────────────────┐
   │ CYCLE 2: Tool Result Processing             │
   ├─────────────────────────────────────────────┤
   │ • Agent Node receives tool results          │
   │ • LLM analyzes results                      │
   │ • Decision: Need screenshot for visual proof│
   │ • Returns: AIMessage with tool_calls        │
   │ • should_continue() → "tools"               │
   ├─────────────────────────────────────────────┤
   │ → Tools Node                                │
   │   ├─▶ Execute take_screenshot(url)          │
   │   │   ├─▶ Launch Playwright browser         │
   │   │   ├─▶ Navigate to URL                   │
   │   │   ├─▶ Save screenshot to static/        │
   │   │   └─▶ Return: "http://localhost:8000/..." │
   │   └─▶ Add ToolMessage to state              │
   └─────────────────────────────────────────────┘
        │
        ▼ (loop back)
        
   ┌─────────────────────────────────────────────┐
   │ CYCLE 3: Final Answer                       │
   ├─────────────────────────────────────────────┤
   │ • Agent Node has all info now               │
   │ • LLM composes final response               │
   │ • Returns: AIMessage (no tool_calls)        │
   │ • should_continue() → END                   │
   │ • Output: "Based on results, found 3        │
   │   broken links. Screenshot: [URL]. Final    │
   │   Answer: Fix these links to improve SEO."  │
   └─────────────────────────────────────────────┘
        │
        ▼

5. API SERVER (main.py)
   ├─▶ Extract final message from result
   ├─▶ Return JSON: { "response": "..." }
   └─▶ HTTP 200 OK
        │
        ▼

6. FRONTEND (page.tsx)
   ├─▶ Receive response
   ├─▶ Parse text for screenshot URLs (regex)
   ├─▶ Split into text + image messages
   ├─▶ Update chatHistory (UI re-renders)
   ├─▶ Set loading = false (hide spinner)
   └─▶ Auto-scroll to bottom
        │
        ▼

7. USER SEES RESPONSE
   └─▶ Chat bubble with analysis
   └─▶ Screenshot displayed inline
```

---

## 🧠 Technology Stack Deep Dive

### Backend Technologies

#### **Python**
**Role**: Backend programming language

**Why Python?**
- 🤖 **AI ecosystem**: Best support for LangChain, LangGraph
- 🐍 **Simplicity**: Readable syntax for rapid development
- 📦 **Libraries**: Rich ecosystem (Playwright, Requests, etc.)
- 🔌 **Integrations**: Easy API calls to AI services (Groq)

---

#### **FastAPI**
**Role**: Web framework for API server

**Why FastAPI over Flask/Django?**
| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Performance | ⚡ ASGI (async) | WSGI (sync) | WSGI (sync) |
| Type hints | ✅ Native | ❌ Optional | ❌ Optional |
| Auto-docs | ✅ Swagger UI | ❌ Manual | ❌ Manual |
| Validation | ✅ Pydantic | ❌ Manual | ✅ Forms |
| Learning curve | Low | Low | High |

**Key Features Used**:
- `CORSMiddleware`: Allows frontend (port 3000) to call backend (port 8000)
- `StaticFiles`: Serves screenshots from `static/` directory
- `Pydantic`: Automatic request validation (`class Request(BaseModel)`)

---

#### **LangGraph**
**Role**: Agent orchestration framework

**Why LangGraph over LangChain's AgentExecutor?**
| Feature | LangGraph | AgentExecutor |
|---------|-----------|---------------|
| Control flow | ✅ Explicit graph | ❌ Black box |
| Loops | ✅ Cycles allowed | ⚠️ Max iterations |
| Debugging | ✅ Step-by-step | ❌ Hard to trace |
| Streaming | ✅ Per-node | ⚠️ Final only |
| State management | ✅ MessagesState | ❌ Manual |

**Core Concepts**:
- **StateGraph**: Defines nodes (agent, tools) and edges (transitions)
- **MessagesState**: Shared state for conversation history
- **ToolNode**: Executes tool calls from LLM responses
- **Conditional edges**: `should_continue()` decides next step

**Why this matters**: Traditional agents (ReAct) can get stuck in loops or make redundant tool calls. LangGraph gives us explicit control to optimize the agent's behavior.

---

#### **LangChain**
**Role**: LLM application framework

**What we use**:
- `ChatGroq`: Client for Groq AI API
- `@tool` decorator: Converts functions to LangChain tools
- `SystemMessage/HumanMessage`: Structured message types

**Why LangChain?**
- 🔗 **Abstraction**: Same code works with OpenAI, Anthropic, Groq
- 🛠️ **Tool ecosystem**: Built-in tool calling patterns
- 📝 **Prompt templates**: Reusable prompt engineering
- 🔌 **Integrations**: 300+ integrations (vector DBs, APIs, etc.)

---

#### **Groq (LLaMA 3.3 70B)**
**Role**: AI inference engine

**Why Groq?**
- ⚡ **Speed**: LPUs (Language Processing Units) → 10x faster than GPUs
- 💰 **Cost**: Free tier with generous limits
- 🧠 **Model**: LLaMA 3.3 70B (open-source, high quality)
- 🛠️ **Tool calling**: Native function calling support

**Alternative**: Could use OpenAI GPT-4, but Groq offers:
- Free tier for development
- Near-instant responses (critical for good UX)
- Open-source model (reproducible)

---

#### **Playwright**
**Role**: Browser automation

**Why Playwright over Selenium/Puppeteer?**
| Feature | Playwright | Selenium | Puppeteer |
|---------|-----------|----------|-----------|
| Speed | ⚡ Fast | 🐢 Slow | ⚡ Fast |
| Auto-wait | ✅ Built-in | ❌ Manual | ⚠️ Basic |
| Multi-browser | ✅ Chrome, Firefox, Safari | ✅ All | ❌ Chrome only |
| Event listeners | ✅ Native | ❌ Manual | ⚠️ Limited |
| Python API | ✅ Official | ✅ Community | ❌ Node.js only |

**Key Features Used**:
- `sync_playwright()`: Synchronous API (simpler than async)
- `page.on()`: Event listeners for console errors, network failures
- `page.screenshot()`: Full-page screenshot capture
- `headless=True/False`: Toggle visible browser for debugging

---

#### **Requests + BeautifulSoup**
**Role**: HTTP client + HTML parser

**Why not use Playwright for link checking?**
- 🚀 **Speed**: Requests is 100x faster (no browser startup)
- 💾 **Memory**: Lightweight vs. full browser instance
- 🎯 **Purpose**: Just need HTTP status codes, not rendering

**Optimization**:
- HEAD request first (doesn't download content)
- Fake User-Agent to bypass basic bot detection
- Timeout after 5 seconds (avoid hanging)

---

### Frontend Technologies

#### **Next.js 16**
**Role**: React framework

**Why Next.js over Create React App?**
| Feature | Next.js | CRA |
|---------|---------|-----|
| Routing | ✅ File-based | ❌ Manual |
| SSR | ✅ Built-in | ❌ None |
| API routes | ✅ Integrated | ❌ Separate server |
| Optimization | ✅ Automatic | ⚠️ Manual |
| TypeScript | ✅ Zero-config | ⚠️ Manual setup |

**Features used in this project**:
- `app/` directory: Modern App Router
- File-based routing: `page.tsx` = route
- Zero-config TypeScript
- Automatic code splitting

**Future benefits**:
- Could add API routes (`app/api/`) to proxy backend
- SSR for SEO (if needed)
- Static site generation (`next export`)

---

#### **React 19**
**Role**: UI library

**Why React?**
- ⚛️ **Component model**: Reusable UI pieces
- 🎣 **Hooks**: Clean state management
- 🔄 **Reactivity**: State changes → automatic UI updates
- 📦 **Ecosystem**: Huge library of components

**Hooks used**:
- `useState`: Chat history, loading state, dark mode
- `useEffect`: localStorage sync, auto-scroll
- `useRef`: Scroll-to-bottom reference

---

#### **TypeScript**
**Role**: Type-safe JavaScript

**Why TypeScript?**
- 🐛 **Catch bugs early**: Compile-time checks vs. runtime crashes
- 🔍 **Autocomplete**: IDE knows types → better DX
- 📚 **Self-documenting**: Types = inline documentation
- 🔧 **Refactoring**: Rename with confidence

**Example types in this project**:
```typescript
interface Message {
  sender: "You" | "AutoQA" | "System";
  text: string;
  isImage?: boolean;
  timestamp?: string;
}
```

Without TypeScript, you might accidentally pass `sender: "user"` and the bug wouldn't surface until runtime.

---

#### **Tailwind CSS**
**Role**: Utility-first CSS framework

**Why Tailwind over Bootstrap/Material-UI?**
| Feature | Tailwind | Bootstrap | MUI |
|---------|----------|-----------|-----|
| Customization | ✅ Full control | ⚠️ Override styles | ⚠️ Theme config |
| Bundle size | ✅ Tiny (tree-shaken) | ❌ Large | ❌ Large |
| Design freedom | ✅ Unlimited | ⚠️ "Bootstrap look" | ⚠️ Material design |
| Learning curve | Medium | Low | Medium |

**Dark mode implementation**:
```tsx
className={darkMode ? "bg-gray-900" : "bg-white"}
```
- Single class toggle
- No separate stylesheets
- Consistent color tokens

---

#### **Axios**
**Role**: HTTP client

**Why Axios over fetch?**
- ✅ Automatic JSON parsing
- ✅ Better error handling
- ✅ Request/response interceptors
- ✅ Timeout support
- ✅ Older browser support

**Usage**:
```typescript
const res = await axios.post("http://localhost:8000/chat", {
  query: textToSend,
});
const responseText = res.data.response;
```

---

## 🎨 Design Decisions

### Why Agentic Architecture?

**Traditional Approach** (what we DIDN'T do):
```
User: "Check example.com for broken links"
→ Hardcoded flow: visit_page() → check_page_links() → return
```

**Problem**: 
- What if the page times out? Still try link checking?
- What if there are no issues? Still take a screenshot?
- Not flexible to new tasks

**Agentic Approach** (what we DID):
```
User: "Check example.com for broken links"
→ Agent decides: "I should use check_page_links()"
→ Agent sees 3 broken links
→ Agent decides: "I should take a screenshot for proof"
→ Agent composes final answer
```

**Benefits**:
- ✅ Adapts to results (screenshot only if needed)
- ✅ Handles errors gracefully (if one tool fails, try another)
- ✅ Extensible (add new tools, agent learns to use them)
- ✅ Natural language interface (no predefined commands)

---

### Why Separate Frontend/Backend?

**Monolith Alternative**: Could have used Streamlit (all Python)

**Why we separated**:
1. **Better UX**: React is faster/smoother than Streamlit
2. **Scalability**: Can deploy frontend (Vercel) and backend (AWS Lambda) separately
3. **Team flexibility**: Frontend and backend devs can work in parallel
4. **Future-proof**: Easy to add mobile app (same API)

---

### Why Local Screenshot Storage?

**Alternatives considered**:
- ❌ S3/Cloud Storage: Overkill for MVP
- ❌ Base64 in response: Large payload, slow
- ✅ Local + static serving: Simple, fast, works for development

**Trade-off**: Not production-ready (need S3 later), but perfect for development.

---

### Why LangChain Tools Instead of Plain Functions?

**Plain function**:
```python
def visit_page(url):
    return browser.goto(url)
```

**LangChain tool**:
```python
@tool
def visit_page(url: str):
    """Visits a page and returns a QA report."""
    return browser.goto(url)
```

**Why the decorator?**:
- 📝 **Docstring → AI prompt**: LLM sees the description
- 🔍 **Type hints → validation**: Ensures correct arguments
- 🔌 **Standard interface**: Works with LangGraph's ToolNode
- 🛠️ **Automatic schema**: LLM knows parameter names/types

---

## 🚀 Future Enhancements

Based on this architecture, we could easily add:

1. **Database integration** (PostgreSQL + SQLAlchemy)
   - Store test history across sessions
   - Track historical data (site performance over time)
   - Add user authentication

2. **More tools**
   - `check_accessibility()`: WCAG compliance
   - `test_performance()`: Lighthouse scores
   - `check_seo()`: Meta tags, structured data
   - `test_forms()`: Automated form submission

3. **Agent memory**
   - Remember previous tests on same URL
   - Compare current vs. previous results
   - Alert on regressions

4. **Scheduled testing**
   - Cron jobs to test sites daily
   - Email alerts on broken links
   - Dashboard for monitoring

5. **Multi-agent collaboration**
   - Specialist agents (SEO agent, performance agent)
   - Supervisor agent to coordinate
   - Parallel tool execution

---

## 📊 Performance Characteristics

### Current System
- **Cold start**: ~3-5 seconds (browser launch)
- **Typical request**: 10-20 seconds (depends on tools used)
- **Link checking**: ~1 second per link
- **Screenshot**: ~2-3 seconds

### Bottlenecks
1. **Playwright launch**: Could use persistent browser
2. **Sequential link checks**: Could parallelize
3. **LLM latency**: ~1-2 seconds per agent cycle
4. **No caching**: Repeat queries recalculate

### Optimization Opportunities
- Browser pool (reuse instances)
- Redis cache (repeat queries)
- Async tool execution (parallel tools)
- Streaming responses (show progress)

---

## 🎓 Key Takeaways

1. **LangGraph > AgentExecutor**: Explicit control flow prevents wasted tokens
2. **Playwright for rendering, Requests for HTTP**: Use the right tool for the job
3. **Type safety everywhere**: TypeScript + Pydantic catch bugs early
4. **Stateful agents**: MessagesState tracks entire conversation
5. **Separation of concerns**: API layer → Agent layer → Tools layer
6. **Development speed**: FastAPI + Next.js enables rapid iteration

---

## 📚 Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Groq Console](https://console.groq.com)
- [Playwright Python Docs](https://playwright.dev/python/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)

---

**Built with ❤️ for intelligent QA automation**
