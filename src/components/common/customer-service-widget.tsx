import { useState, useRef, useEffect } from "react";
import {
  Headphones,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { useSupportTickets } from "@/hooks/use-support-tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "How do I fund my account?",
  "Check my withdrawal status",
  "Assistance with live trading",
  "Account verification inquiry",
];

export function CustomerServiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New ticket state
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  const { tickets, repliesByTicket, loading, createTicket, replyToTicket } = useSupportTickets();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select latest ticket if available
  useEffect(() => {
    if (tickets.length > 0 && !activeTicketId) {
      setActiveTicketId(tickets[0].id);
    }
  }, [tickets, activeTicketId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, repliesByTicket, activeTicketId, isStartingNew]);

  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? tickets[0] ?? null;
  const currentReplies = activeTicket ? repliesByTicket[activeTicket.id] ?? [] : [];

  // Count unread / admin replies
  const adminRepliesCount = Object.values(repliesByTicket).reduce((sum, replies) => {
    return sum + replies.filter((r) => r.authorIsAdmin).length;
  }, 0);

  async function handleSendReply() {
    if (!activeTicket || !replyMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await replyToTicket(activeTicket.id, replyMessage.trim());
      setReplyMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleCreateNewTicket(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await createTicket({
        subject: newSubject.trim(),
        message: newMessage.trim(),
        category: newCategory,
      });
      setNewSubject("");
      setNewMessage("");
      setIsStartingNew(false);
      toast.success("Message sent to customer service agent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSelectPrompt(prompt: string) {
    setNewSubject(prompt);
    setNewMessage(`Hello Customer Service, I would like assistance with: "${prompt}". Thank you.`);
    setIsStartingNew(true);
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-background/95 px-3 py-1.5 text-xs font-semibold text-emerald-400 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-right-4">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Customer Service Online</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white hover:scale-105 active:scale-95",
            "border border-white/20 hover:shadow-emerald-500/25",
            isOpen && "rotate-90 bg-zinc-800 text-zinc-300",
          )}
          aria-label="Toggle Customer Service Chat"
          title="Customer Service Live Support"
        >
          {isOpen ? (
            <X className="size-6 transition-transform" />
          ) : (
            <>
              <Headphones className="size-6" />
              {adminRepliesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black border-2 border-background animate-pulse">
                  {adminRepliesCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Live Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[620px] h-[82vh] flex flex-col rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Headphones className="size-4.5" />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Customer Service</h3>
                  <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-400 py-0 px-1.5 h-4">
                    Live 24/7
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Institutional Support Desk</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {tickets.length > 0 && !isStartingNew && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setIsStartingNew(true)}
                  title="Start New Inquiry"
                >
                  <Plus className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Ticket Switcher dropdown if multiple tickets exist */}
          {tickets.length > 1 && !isStartingNew && (
            <div className="flex items-center justify-between border-b border-border bg-background/50 px-3 py-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Inquiry:</span>
              <div className="relative flex-1 max-w-[280px]">
                <select
                  value={activeTicket?.id || ""}
                  onChange={(e) => setActiveTicketId(e.target.value)}
                  className="w-full truncate rounded bg-muted/40 px-2 py-1 text-xs text-foreground outline-none border border-border cursor-pointer"
                >
                  {tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subject} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {isStartingNew || (!loading && tickets.length === 0) ? (
              // New Inquiry / Welcome Screen
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <Sparkles className="size-4" />
                    <span>Welcome to SmartCapital Service Desk</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Our dedicated client team is available 24/7. Select a common inquiry below or send us a direct message.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Inquiries:</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSelectPrompt(prompt)}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <span>{prompt}</span>
                        <ChevronDown className="size-3 -rotate-90 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateNewTicket} className="space-y-2.5 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Topic / Subject</label>
                    <Input
                      placeholder="e.g. Question about my deposit"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none"
                    >
                      <option value="general">General Support</option>
                      <option value="deposit">Deposit & Funding</option>
                      <option value="withdrawal">Withdrawal Request</option>
                      <option value="trading">Trading Execution</option>
                      <option value="account">Account & Security</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Your Message</label>
                    <Textarea
                      placeholder="Describe what you need assistance with…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="text-xs resize-none"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    {tickets.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setIsStartingNew(false)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSending || !newSubject.trim() || !newMessage.trim()}
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Send className="mr-1.5 size-3.5" />
                      {isSending ? "Connecting..." : "Start Chat"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : activeTicket ? (
              // Active Conversation Thread
              <div className="space-y-3">
                {/* Initial Ticket Question */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm">
                    <p className="font-semibold text-[11px] text-primary-foreground/90 mb-0.5">{activeTicket.subject}</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{activeTicket.message}</p>
                    <span className="block mt-1 text-[10px] text-primary-foreground/75 text-right">
                      {formatDateTime(activeTicket.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Replies Thread */}
                {currentReplies.map((reply) => {
                  const isAdmin = reply.authorIsAdmin;
                  return (
                    <div
                      key={reply.id}
                      className={cn("flex flex-col", isAdmin ? "items-start" : "items-end")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm space-y-1",
                          isAdmin
                            ? "rounded-tl-sm bg-muted border border-border text-foreground"
                            : "rounded-tr-sm bg-primary text-primary-foreground",
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                          {isAdmin ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Headphones className="size-3" />
                              {reply.authorName || "Customer Support Agent"}
                            </span>
                          ) : (
                            <span className="text-primary-foreground/90">You</span>
                          )}
                          <span>·</span>
                          <span className={isAdmin ? "text-muted-foreground" : "text-primary-foreground/75"}>
                            {formatDateTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className={cn("text-xs leading-relaxed whitespace-pre-wrap", isAdmin ? "text-foreground" : "text-primary-foreground")}>
                          {reply.message}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            ) : null}
          </div>

          {/* Bottom Reply Box (When In Active Conversation) */}
          {!isStartingNew && activeTicket && (
            <div className="border-t border-border bg-background/80 p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type a message to Customer Service…"
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="min-h-10 resize-none text-xs py-2 bg-muted/40"
                />
                <Button
                  size="icon"
                  onClick={handleSendReply}
                  disabled={isSending || !replyMessage.trim()}
                  className="size-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
                Press Enter to send · Monitored 24/7 by SmartCapital agents
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
