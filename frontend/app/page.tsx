"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  sender: "You" | "AutoQA" | "System";
  text: string;
  isImage?: boolean;
  timestamp?: string;
}

interface TestHistory {
  query: string;
  timestamp: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Example queries
  const exampleQueries = [
    "Visit https://example.com and analyze the page structure",
    "Check https://news.ycombinator.com for broken links",
    "Take a screenshot of https://github.com",
    "Test https://www.google.com and check console errors",
  ];

  // Load dark mode preference and test history from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    
    const savedHistory = localStorage.getItem("testHistory");
    if (savedHistory) {
      setTestHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Auto-scroll to bottom whenever chatHistory changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Save test history to localStorage
  const saveTestHistory = (newQuery: string) => {
    const newHistory = [
      { query: newQuery, timestamp: new Date().toISOString() },
      ...testHistory.slice(0, 9), // Keep only last 10
    ];
    setTestHistory(newHistory);
    localStorage.setItem("testHistory", JSON.stringify(newHistory));
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || query;
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString();

    // 1. Add User Message
    const userMsg: Message = { sender: "You", text: textToSend, timestamp };
    setChatHistory((prev) => [...prev, userMsg]);
    
    setQuery(""); 
    setLoading(true);
    setShowExamples(false);
    
    // Save to history
    saveTestHistory(textToSend);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        query: textToSend,
      });

      const responseText = res.data.response;
      const responseTimestamp = new Date().toLocaleTimeString();
      
      // --- SMART SPLIT LOGIC ---
      const imageRegex = /(http:\/\/localhost:8000\/static\/screenshot_[a-zA-Z0-9_]+\.png)/;
      const match = responseText.match(imageRegex);

      if (match) {
        const imageUrl = match[0];
        const cleanText = responseText.replace(imageUrl, "").trim();

        setChatHistory((prev) => {
          const newMessages = [...prev];
          
          if (cleanText) {
             newMessages.push({ sender: "AutoQA", text: cleanText, isImage: false, timestamp: responseTimestamp });
          }
          
          newMessages.push({ sender: "AutoQA", text: imageUrl, isImage: true, timestamp: responseTimestamp });
          
          return newMessages;
        });

      } else {
        setChatHistory((prev) => [
          ...prev, 
          { sender: "AutoQA", text: responseText, isImage: false, timestamp: responseTimestamp }
        ]);
      }

    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev, 
        { sender: "System", text: "❌ Error connecting to backend. Make sure the server is running on http://localhost:8000", timestamp: new Date().toLocaleTimeString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setChatHistory([]);
      setShowExamples(true);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear the test history?")) {
      setTestHistory([]);
      localStorage.removeItem("testHistory");
    }
  };

  const useExampleQuery = (example: string) => {
    setQuery(example);
    setShowExamples(false);
  };

  const useHistoryItem = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
  };

  return (
    <main className={`flex min-h-screen flex-col transition-colors duration-200 ${
      darkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors ${
        darkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/80 border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐞</div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                AutoQA Agent
              </h1>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                AI-Powered Web Testing Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-all ${
                darkMode 
                  ? "hover:bg-gray-700 text-gray-300" 
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title="Test History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={clearChat}
              className={`p-2 rounded-lg transition-all ${
                darkMode 
                  ? "hover:bg-gray-700 text-gray-300" 
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title="Clear Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all ${
                darkMode 
                  ? "bg-gray-700 text-yellow-400" 
                  : "bg-gray-100 text-gray-700"
              }`}
              title="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Test History Sidebar */}
      {showHistory && (
        <div className={`fixed inset-y-0 right-0 w-80 shadow-2xl z-20 transform transition-transform duration-300 ${
          darkMode ? "bg-gray-800 border-l border-gray-700" : "bg-white border-l border-gray-200"
        }`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Test History
            </h2>
            <div className="flex gap-2">
              <button
                onClick={clearHistory}
                className={`text-xs px-2 py-1 rounded ${
                  darkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                Clear
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className={`text-xs px-2 py-1 rounded ${
                  darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                }`}
              >
                Close
              </button>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {testHistory.length === 0 ? (
              <div className={`p-4 text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No test history yet
              </div>
            ) : (
              testHistory.map((item, index) => (
                <div
                  key={index}
                  onClick={() => useHistoryItem(item.query)}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    darkMode 
                      ? "border-gray-700 hover:bg-gray-700/50" 
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <p className={`text-sm truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    {item.query}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8 overflow-hidden">
        <div className={`w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
        }`} style={{ height: "calc(100vh - 200px)", minHeight: "600px", maxHeight: "calc(100vh - 140px)" }}>
          
          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${
            darkMode ? "bg-gray-900/50" : "bg-gray-50/30"
          }`}>
            {chatHistory.length === 0 && showExamples && (
              <div className="flex flex-col items-center justify-start pt-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-6xl mb-4">🚀</div>
                  <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Welcome to AutoQA Agent
                  </h2>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Start testing websites with AI-powered automation
                  </p>
                </div>
                
                <div className="w-full max-w-2xl space-y-3">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}>
                    Try these examples:
                  </p>
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => useExampleQuery(example)}
                      className={`w-full text-left p-4 rounded-xl transition-all transform hover:scale-[1.02] ${
                        darkMode 
                          ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700" 
                          : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm hover:shadow"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`text-lg ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                          {index === 0 ? "🌐" : index === 1 ? "🔗" : index === 2 ? "📸" : "🔍"}
                        </span>
                        <span className="text-sm flex-1">{example}</span>
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "You" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-lg transition-all ${
                    msg.sender === "You"
                      ? darkMode
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-blue-600 text-white rounded-br-none"
                      : msg.sender === "System"
                      ? darkMode
                        ? "bg-red-900/30 text-red-300 border border-red-800"
                        : "bg-red-50 text-red-800 border border-red-200"
                      : darkMode
                      ? "bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs opacity-70 uppercase tracking-wide">
                      {msg.sender}
                    </strong>
                    {msg.timestamp && (
                      <span className="text-xs opacity-50 ml-2">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                  
                  {msg.isImage ? (
                    <div className="mt-2 space-y-2">
                      <img 
                        src={msg.text} 
                        alt="Screenshot" 
                        className="rounded-lg border-2 w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(msg.text, "_blank")}
                      />
                      <button
                        onClick={() => window.open(msg.text, "_blank")}
                        className={`text-xs px-3 py-1 rounded-lg flex items-center gap-1 ${
                          darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        View Full Size
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className={`px-6 py-3 border-t flex items-center gap-3 ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                AI Agent is analyzing and testing...
              </span>
            </div>
          )}

          {/* Input Area */}
          <div className={`p-4 border-t ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="flex gap-3">
              <input
                type="text"
                className={`flex-1 px-5 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  darkMode 
                    ? "bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-500" 
                    : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                }`}
                placeholder="Describe your test case... (Press Enter to send)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !query.trim()}
                className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                  loading || !query.trim()
                    ? darkMode
                      ? "bg-gray-700 cursor-not-allowed text-gray-500"
                      : "bg-gray-200 cursor-not-allowed text-gray-400"
                    : darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </>
                ) : (
                  <>
                    Run Test
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            
            {/* Stats Bar */}
            <div className={`flex items-center justify-between mt-3 text-xs ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}>
              <div className="flex items-center gap-4">
                <span>Tests Run: {testHistory.length}</span>
                <span>•</span>
                <span>Messages: {chatHistory.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}></div>
                <span>{loading ? "Processing" : "Ready"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`text-center py-4 text-xs ${
        darkMode ? "text-gray-600" : "text-gray-400"
      }`}>
        <p>Made with ❤️ using Next.js, LangGraph & Groq AI • AutoQA Agent v1.0</p>
      </footer>
    </main>
  );
}