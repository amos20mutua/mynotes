"use client";

import { Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { conversations } from "@/mock/data";
import { useMarketStore } from "@/lib/state/use-market-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MessagesPage() {
  const activeConversationId = useMarketStore((state) => state.activeConversationId);
  const setActiveConversation = useMarketStore((state) => state.setActiveConversation);
  const allMessages = useMarketStore((state) => state.messages);
  const sendMessage = useMarketStore((state) => state.sendMessage);
  const messages = allMessages.filter((message) => message.conversationId === activeConversationId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="space-y-4">
          <div>
            <Badge>Realtime-ready chat</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-white">Conversations</h1>
          </div>
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversation(conversation.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  conversation.id === activeConversationId ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/8 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{conversation.buyerName}</p>
                  {conversation.unread ? <Badge className="border-orange-300/20 bg-orange-300/10 text-orange-100">{conversation.unread} unread</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-slate-300">{conversation.lastMessage}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{conversation.lastSeen}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex min-h-[680px] flex-col">
          <div className="border-b border-white/8 pb-4">
            <h2 className="text-xl font-semibold text-white">Seller chat thread</h2>
            <p className="mt-2 text-sm text-slate-400">Typing state and file uploads can be expanded with Supabase Realtime and Storage.</p>
          </div>
          <div className="flex-1 space-y-4 py-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "buyer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-lg rounded-[28px] px-4 py-3 text-sm leading-6 ${message.sender === "buyer" ? "bg-cyan-300 text-slate-950" : "bg-white/6 text-slate-200"}`}>
                  <p>{message.body}</p>
                  <p className={`mt-2 text-xs ${message.sender === "buyer" ? "text-slate-700" : "text-slate-500"}`}>{message.sentAt}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto grid gap-3 sm:grid-cols-[auto_1fr_auto]">
            <Button variant="secondary" type="button" onClick={() => toast.info("Attachment flow is structure-ready for Supabase Storage.")}>
              <Paperclip className="size-4" />
            </Button>
            <Input id="chat-input" placeholder="Type a message to the seller..." />
            <Button
              variant="accent"
              type="button"
              onClick={() => {
                const input = document.getElementById("chat-input") as HTMLInputElement | null;
                if (!input) {
                  toast.error("Chat input is unavailable right now");
                  return;
                }
                const value = input?.value.trim();
                if (!value) {
                  toast.error("Type a message first");
                  return;
                }
                sendMessage(value);
                input.value = "";
              }}
            >
              <SendHorizontal className="size-4" />
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
