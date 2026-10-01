"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Plus,
  Send,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
        }

        if (!user) {
          console.error("No logged-in user found.");
          setAuthLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("chat_conversations")
          .select("id, user_id, title, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Conversation loading error:", error);
        } else {
          setConversations(data || []);
        }
      } catch (error) {
        console.error("Chat loading error:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    loadChat();
  }, []);

  const loadConversation = async (id: string) => {
    if (!userId) {
      console.error("User is not logged in.");
      return;
    }

    setConversationId(id);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("conversation_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Messages loading error:", error);
      return;
    }

    setMessages(
      (data || []).map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
      }))
    );
  };

  /*
   * CLEAR CHAT
   *
   * This now clears:
   * - UI messages
   * - conversation list
   * - current conversation
   * - database messages
   * - database conversations
   */
  const clearChat = async () => {
    if (clearing || !userId) return;

    setClearing(true);

    /*
     * Clear UI immediately.
     */
    setMessages([]);
    setConversations([]);
    setConversationId(null);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error(
          "Clear chat failed:",
          data.error || "Unable to clear chat."
        );

        /*
         * If database deletion fails, reload conversations
         * so UI doesn't incorrectly show an empty state.
         */
        const { data: conversationData } = await supabase
          .from("chat_conversations")
          .select("id, user_id, title, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        setConversations(conversationData || []);
      }
    } catch (error) {
      console.error("Clear chat request error:", error);

      const { data: conversationData } = await supabase
        .from("chat_conversations")
        .select("id, user_id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      setConversations(conversationData || []);
    } finally {
      setClearing(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setInput("");
    setConversationId(null);
  };

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    if (!userId) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Please log in first to use the AI Medical Chat.",
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          conversationId,
        }),
      });

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Chat server returned an invalid response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get response from AI."
        );
      }

      if (!data.response) {
        throw new Error("AI returned an empty response.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);

        const {
          data: conversationData,
          error,
        } = await supabase
          .from("chat_conversations")
          .select("id, user_id, title, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Conversation refresh error:", error);
        } else {
          setConversations(conversationData || []);
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat request error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[650px] gap-5">
      <aside className="flex w-[310px] shrink-0 flex-col rounded-2xl border border-cyan-500/20 bg-[#061525]">
        <div className="border-b border-cyan-500/15 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">
              Conversations
            </h2>

            <button
              onClick={clearChat}
              disabled={clearing || authLoading}
              title="Clear Chat"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={newConversation}
            className="mt-5 flex w-full items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 text-left font-medium text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
          >
            <Plus className="h-5 w-5" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() =>
                    loadConversation(conversation.id)
                  }
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                    conversationId === conversation.id
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-cyan-500/5 hover:text-slate-200"
                  }`}
                >
                  <div className="truncate font-medium">
                    {conversation.title}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#061525]">
        <div className="flex items-center justify-between border-b border-cyan-500/15 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                AI Medical Chat
              </h1>

              <p className="text-sm text-slate-400">
                Ask about symptoms, terms, or lab results
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            disabled={clearing || authLoading}
            className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? "Clearing..." : "Clear Chat"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {authLoading ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              Loading chat...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                <Bot className="h-10 w-10 text-cyan-400" />
              </div>

              <h2 className="text-2xl font-semibold text-slate-100">
                How can I help you today?
              </h2>

              <p className="mt-3 max-w-xl text-slate-400">
                I can explain medical terms, lab values, and reports
                in plain language.
              </p>
            </div>
          ) : (
            <div className="space-y-5 p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-5 py-3 ${
                      message.role === "user"
                        ? "bg-cyan-500 text-slate-950"
                        : "border border-cyan-500/15 bg-[#0a1d30] text-slate-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-cyan-500/15 bg-[#0a1d30] px-5 py-3 text-sm text-slate-400">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-cyan-500/15 p-5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading || authLoading}
              className="flex-1 rounded-xl border border-cyan-500/20 bg-[#071a2c] px-5 py-4 text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-50"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || authLoading}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

            <p className="text-sm leading-6 text-slate-400">
              This analysis is for educational purposes only and does
              not constitute a medical diagnosis. Always consult a
              qualified healthcare professional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}