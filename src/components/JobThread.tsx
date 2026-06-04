"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export type JobThreadMessage = {
  id: string;
  senderRole: "customer" | "artisan";
  body: string;
  sentAt: string;
};

type JobThreadProps = {
  jobRequestId: string;
  currentRole: "customer" | "artisan";
  messages?: JobThreadMessage[];
  onSend?: (message: string) => Promise<void> | void;
};

export function JobThread({
  jobRequestId,
  currentRole,
  messages: initialMessages = [],
  onSend,
}: JobThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    setDraft("");

    try {
      await onSend?.(body);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          senderRole: currentRole,
          body,
          sentAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#0d8b66]">Job chat</p>
          <h2 className="text-lg font-semibold text-[#101410]">Request {jobRequestId.slice(0, 8)}</h2>
        </div>
      </div>

      <div className="mt-4 grid max-h-80 gap-2 overflow-y-auto rounded-lg border border-[#eee8dc] bg-[#f8f4ea] p-3">
        {messages.length ? (
          messages.map((message) => {
            const isOwn = message.senderRole === currentRole;
            return (
              <div
                key={message.id}
                className={`max-w-[84%] rounded-lg px-3 py-2 text-sm leading-5 ${
                  isOwn
                    ? "ml-auto bg-[#0d8b66] text-white"
                    : "mr-auto border border-[#ddd8cd] bg-white text-[#101410]"
                }`}
              >
                {message.body}
              </div>
            );
          })
        ) : (
          <p className="rounded-md bg-white px-3 py-2 text-sm text-[#5f6a64]">
            Messages will appear here after the job is claimed.
          </p>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void sendMessage();
          }}
          className="h-11 rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
          placeholder="Write a message"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden="true" />
          Send
        </button>
      </div>
    </section>
  );
}
