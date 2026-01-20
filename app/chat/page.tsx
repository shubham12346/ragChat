"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await fetch(
        `/api/history?sessionId=${sessionId}`
      ).then(res => res.json());
      console.log("history--------", history);
      setHistory(history);
    };
    fetchHistory();
  }, [sessionId]);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    id: "document-rag-chat", // optional session ID
  });

  const [input, setInput] = useState("");
  const historyMessages = history.map((message, index) => ({
    id: `history-${index}`,
    role: message.role,
    parts: [{ type: "text" as const, text: message.content }],
  }));
  const allMessages = [...historyMessages, ...messages];
  console.log("messages--------", messages);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b p-4 font-semibold">
        📚 Document Chat (RAG)
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            {/* Render parts not just `.content` */}
            {message.parts.map((part, index) =>
              part.type === "text" ? <span key={index}>{part.text}</span> : null
            )}
          </div>
        ))}
      </main>

      {/* Status Controls */}
      {(status === "submitted" || status === "streaming") && (
        <div className="border-t p-4 flex items-center gap-2">
          {status === "submitted" && (
            <span className="text-sm text-gray-500">
              Waiting for response...
            </span>
          )}
          {status === "streaming" && (
            <span className="text-sm text-gray-500">Streaming response...</span>
          )}
          <button
            onClick={() => stop()}
            className="ml-auto rounded bg-red-500 px-3 py-1 text-white"
          >
            Stop
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="border-t p-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={status !== "ready" && status !== "error"}
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={status !== "ready" && status !== "error"}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Error Handling */}
      {error && (
        <div className="border-t p-4 text-center text-red-600">
          <p>An error occurred.</p>
          <button
            onClick={() => setInput("")}
            className="mt-2 rounded bg-gray-200 px-3 py-1"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
