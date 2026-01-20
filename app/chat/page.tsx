"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIDataTypes, UIMessage, UITools } from "ai";
import { useCallback, useEffect, useState } from "react";
import History from "./component/history";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const fetchHistory = useCallback(async (activeSessionId: string | null) => {
    if (!activeSessionId) {
      setHistory([]);
      return;
    }
    const history = await fetch(
      `/api/chat?sessionId=${activeSessionId}`
    ).then(res => res.json());
    console.log("history messages --------", history);
    setHistory(history);
  }, []);

  useEffect(() => {
    fetchHistory(sessionId);
  }, [fetchHistory, sessionId]);

  const { messages, sendMessage, status, stop, error } = useChat<UIMessage<unknown, UIDataTypes, UITools>>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    id: sessionId || '', // optional session ID
    onFinish: async () => {
      await fetchHistory(sessionId);
    },
  });

  const [input, setInput] = useState("");
  const historyMessages = history?.length > 0 && history?.map((message, index) => ({
    id: `history-${index}`,
    role: message.role,
    parts: [{ type: "text" as const, text: message.content }],
    citations: typeof message.citations === "string"
      ? JSON.parse(message.citations)
      : message.citations,
  }));
  const messageText = (message: UIMessage<unknown, UIDataTypes, UITools>) =>
    message.parts?.find((part) => part.type === "text")?.text || "";

  const historyKeySet = new Set(
    (historyMessages || []).map(
      (message: any) => `${message.role}:${message.parts?.[0]?.text || ""}`
    )
  );
  const liveMessages = messages.filter(
    (message) => !historyKeySet.has(`${message.role}:${messageText(message)}`)
  );
  const allMessages = historyMessages ? [...historyMessages, ...liveMessages] : messages;
  console.log("messages--------", messages);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b p-4 font-semibold" onClick={() => router.push("/")}>
        📚 Document Chat (RAG)
        
      </header>

      {/* Chat Messages */}
      <main className="grid h-full overflow-hidden grid-cols-[280px_1fr]">
        <aside className="border-r overflow-y-auto">
          <History />
        </aside>
        <section className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-6">
            {allMessages.map((message) => {
              const citations = (message as any)?.citations;
              return (
              <div
                key={message.id}
                className={message.role === "user" ? "text-right" : "text-left"}
              >
                {/* Render parts not just `.content` */}
                {message.parts.map((part, index) =>
                  part.type === "text" ? <span key={index}>{part.text}</span> : null
                )}
                {message.role === "assistant" &&
                  status === "ready" &&
                  citations &&
                  citations?.length > 0 && (
                  <div className="text-sm text-gray-500">
                    <p>Citations:</p>
                    {citations?.map((citation: any) => (
                      <p key={citation.index}>{citation.content}</p>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>

          {/* Status Controls */}
          {(status === "submitted" || status === "streaming") && (
            <div className="border-t p-4 flex items-center gap-2">
              {status === "submitted" && (
                <span className="text-sm text-gray-500">
                  Waiting for response...
                </span>
              )}
              {status === "streaming" && (
                <span className="text-sm text-gray-500">
                  Streaming response...
                </span>
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
        </section>
      
      </main>

    
    </div>
  );
}
