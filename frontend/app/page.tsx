"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  sender: "You" | "AutoQA" | "System";
  text: string;
  isImage?: boolean; 
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever chatHistory changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!query.trim()) return;

    // 1. Add User Message
    const userMsg: Message = { sender: "You", text: query };
    setChatHistory((prev) => [...prev, userMsg]);
    
    const currentQuery = query;
    setQuery(""); 
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        query: currentQuery,
      });

      const responseText = res.data.response;
      
      // --- SMART SPLIT LOGIC ---
      // Find the image URL
      const imageRegex = /(http:\/\/localhost:8000\/static\/screenshot_[a-zA-Z0-9_]+\.png)/;
      const match = responseText.match(imageRegex);

      if (match) {
        const imageUrl = match[0];
        
        // Remove the URL from the text so we don't show the link twice
        // We also trim() to remove extra whitespace left behind
        const cleanText = responseText.replace(imageUrl, "").trim();

        setChatHistory((prev) => {
          const newMessages = [...prev];
          
          // Only add the text message if there is actual text remaining
          if (cleanText) {
             newMessages.push({ sender: "AutoQA", text: cleanText, isImage: false });
          }
          
          // Then add the image message
          newMessages.push({ sender: "AutoQA", text: imageUrl, isImage: true });
          
          return newMessages;
        });

      } else {
        // No image found? Just show the text.
        setChatHistory((prev) => [
          ...prev, 
          { sender: "AutoQA", text: responseText, isImage: false }
        ]);
      }

    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev, 
        { sender: "System", text: "❌ Error connecting to backend." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-black font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">🐞 AutoQA Agent</h1>
        <p className="text-gray-500 text-sm mt-2">Autonomous Web Tester • Powered by LangGraph & Playwright</p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px]">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <p>Ready to test.</p>
              <p className="text-xs">Try: "Go to news.ycombinator.com, take a screenshot, and tell me the top headline."</p>
            </div>
          )}

          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "You" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                  msg.sender === "You"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : msg.sender === "System"
                    ? "bg-red-100 text-red-800"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                }`}
              >
                <strong className="block text-xs opacity-70 mb-2 uppercase tracking-wide">
                  {msg.sender}
                </strong>
                
                {msg.isImage ? (
                  <div className="mt-2">
                    <img 
                      src={msg.text} 
                      alt="Screenshot" 
                      className="rounded-lg border border-gray-200 w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(msg.text, "_blank")}
                    />
                    <p className="text-xs text-blue-500 mt-2 hover:underline cursor-pointer" onClick={() => window.open(msg.text, "_blank")}>
                      View Full Size ↗
                    </p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
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
          <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            Agent is testing...
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          <input
            type="text"
            className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Describe your test case..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-md ${
              loading
                ? "bg-gray-200 cursor-not-allowed text-gray-400 shadow-none"
                : "bg-black hover:bg-gray-800 hover:shadow-lg text-white"
            }`}
          >
            {loading ? "Running..." : "Run Test"}
          </button>
        </div>
      </div>
    </main>
  );
}