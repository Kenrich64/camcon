"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import API from "@/lib/api";
import toast from "react-hot-toast";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi, I am your Camcon AI assistant. Ask me about participation trends, event performance, departments, or feedback.",
};

export default function AIChatbot({ context = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [typedContent, setTypedContent] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, typedContent, isOpen]);

  const latestAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        return i;
      }
    }
    return -1;
  }, [messages]);

  useEffect(() => {
    if (latestAssistantIndex < 0) {
      return;
    }

    const latest = messages[latestAssistantIndex];
    if (!latest || latest.role !== "assistant") {
      return;
    }

    let i = 0;
    const fullText = latest.content || "";
    setTypedContent("");

    const timer = setInterval(() => {
      i += 1;
      setTypedContent(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
      }
    }, 7);

    return () => clearInterval(timer);
  }, [latestAssistantIndex, messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) {
      return;
    }

    setInput("");
    setLoading(true);
    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await API.post("/ai/chat", {
        question,
        context,
      });

      const answer = response?.data?.response || "I could not generate an answer right now.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (apiError) {
      const message =
        apiError?.response?.data?.error ||
        apiError?.response?.data?.message ||
        "Failed to reach AI assistant";
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I am currently unavailable. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onInputKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
      >
        <MessageCircle size={18} />
        AI Chat
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center">
          <div className="animate-slide-in w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Camcon AI Assistant</p>
                  <p className="text-xs text-slate-500">Campus analytics chat</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isLatestAssistant = !isUser && index === latestAssistantIndex;
                const content = isLatestAssistant ? typedContent : message.content;

                return (
                  <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{content}</p>
                    </div>
                  </div>
                );
              })}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Ask about events, attendance, departments, or feedback..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
