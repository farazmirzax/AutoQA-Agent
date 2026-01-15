"use client"; // Required because we use State (interactive UI)

import { useState } from "react";
import axios from "axios";

// 1. Define the Types (TypeScript)
interface Message {
  sender: "You" | "AutoQA" | "System";
  text: string;
}

export default function Home() {
  // 2. React State Hooks
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // 3. The Handler Function
  const sendMessage = async () => {
    if (!query.trim()) return;

    // Add User Message immediately
    const userMsg: Message = { sender: "You", text: query };
    setChatHistory((prev) => [...prev, userMsg]);
    
    const currentQuery = query;
    setQuery(""); // Clear input
    setLoading(true);

    try {
      // Call Backend
      const res = await axios.post("http://localhost:8000/chat", {
        query: currentQuery,
      });

      // Add Agent Response
      const agentMsg: Message = { sender: "AutoQA", text: res.data.response };
      setChatHistory((prev) => [...prev, agentMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = { sender: "System", text: "❌ Error connecting to backend." };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle "Enter" key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50 text-black font-sans">
      <h1 className="text-4xl font-bold mb-2">🐞 AutoQA Agent</h1>
      <p className="text-gray-500 mb-8 text-sm">Next.js 15 + Python LangGraph</p>

      {/* Chat Container */}
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-[500px]">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 && (
            <p className="text-center text-gray-400 mt-10">
              Ready to test. Type a URL below.
            </p>
          )}

          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "You" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === "You"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : msg.sender === "System"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <strong className="block text-xs opacity-70 mb-1">
                  {msg.sender}
                </strong>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-500">
                Agent is browsing... 🌎
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Check example.com..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-black hover:bg-gray-800 text-white"
            }`}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}