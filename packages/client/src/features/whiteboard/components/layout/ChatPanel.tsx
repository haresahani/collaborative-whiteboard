import { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useCollaborationStore, type ChatMessage } from "../../store/collaborationStore";
import { socketService } from "../../../../api/ws";
import { usePanelFocus } from "../../hooks/usePanelFocus";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const closeButtonRef = usePanelFocus(isOpen);
  const chatMessages = useCollaborationStore((state) => state.chatMessages);
  const activeUsers = useCollaborationStore((state) => state.activeUsers);
  const [inputText, setInputText] = useState("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const res = socketService.sendChatMessage(trimmed);
    if (!res.ok) {
      setErrorNotice(res.error || "Failed to send message");
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        "wb-chat-panel",
        "fixed right-4 top-20 bottom-20 z-40 w-80 max-w-[calc(100vw-2rem)]",
        "flex flex-col bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/60 dark:border-slate-800",
        "rounded-2xl shadow-2xl text-slate-100 overflow-hidden transition-all duration-200"
      )}
      aria-label="Room Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Collaborative Chat
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeUsers.length || 1} online
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Real-time room messages</p>
          </div>
        </div>

        <button
          ref={closeButtonRef as React.RefObject<HTMLButtonElement>}
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          aria-label="Close chat panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-300">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Start the conversation with collaborators on this board.
            </p>
          </div>
        ) : (
          chatMessages.map((msg: ChatMessage) => {
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            return (
              <div key={msg.id} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                  <span className="font-semibold text-indigo-300">
                    {msg.displayName || "Anonymous"}
                  </span>
                  {timeStr && <span className="text-[10px] text-slate-500">{timeStr}</span>}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-200 break-words leading-relaxed shadow-sm">
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error notification banner */}
      {errorNotice && (
        <div className="px-4 py-1.5 bg-rose-500/10 text-rose-400 border-t border-rose-500/20 text-xs text-center font-medium">
          {errorNotice}
        </div>
      )}

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            className={cn(
              "w-full py-2 pl-3 pr-10 rounded-xl text-xs bg-slate-800/90 border border-slate-700/80",
              "text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              "transition-all"
            )}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "absolute right-1.5 p-1.5 rounded-lg text-slate-100 bg-indigo-600 hover:bg-indigo-500",
              "disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed transition-all"
            )}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
