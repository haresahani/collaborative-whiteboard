import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useCollaborationStore, type ChatMessage } from "../../store/collaborationStore";
import { useAuthStore } from "../../../../store/authStore";
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
  const currentUser = useAuthStore((state) => state.user);
  const [inputText, setInputText] = useState("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const myUserId = socketService.getMyUserId() || currentUser?.id;

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

  return (
    <>
      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop",
          isOpen && "wb-overlay-backdrop--open"
        )}
        onClick={onClose}
        aria-label="Close chat panel"
      />

      <aside
        id="board-chat-panel"
        className={cn("wb-right-panel", isOpen && "wb-right-panel--open")}
        aria-hidden={!isOpen}
        aria-labelledby="board-chat-panel-title"
        role="dialog"
        tabIndex={-1}
      >
        <div className="wb-right-panel__shell">
          {/* Header */}
          <div className="wb-right-panel__header">
            <div className="wb-right-panel__heading">
              <MessageSquare size={16} />
              <h3 id="board-chat-panel-title" className="wb-right-panel__title">
                Collaborative Chat
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                {activeUsers.length || 1} online
              </span>
            </div>

            <button
              ref={closeButtonRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className="wb-icon-button wb-icon-button--small"
              onClick={onClose}
              aria-label="Close chat panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div
            className="wb-right-panel__body"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "var(--wb-muted)",
                  padding: 24,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(99, 102, 241, 0.12)",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--wb-text)" }}>
                  No messages yet
                </p>
                <p style={{ fontSize: 11, color: "var(--wb-muted)", marginTop: 4, maxWidth: 210 }}>
                  Send a message to chat with users live on this whiteboard.
                </p>
              </div>
            ) : (
              chatMessages.map((msg: ChatMessage) => {
                const isSelf = Boolean(myUserId && msg.userId === myUserId);
                const timeStr = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignSelf: isSelf ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                      gap: 3,
                    }}
                  >
                    {/* Header: Name and Time */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        justifyContent: isSelf ? "flex-end" : "flex-start",
                        padding: "0 2px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 11,
                          color: isSelf ? "#818cf8" : "#a78bfa",
                        }}
                      >
                        {isSelf ? "You" : msg.displayName || "Guest"}
                      </span>
                      {timeStr && (
                        <span style={{ fontSize: 10, color: "var(--wb-muted)" }}>
                          {timeStr}
                        </span>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: isSelf ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: isSelf
                          ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                          : "var(--wb-surface-muted, rgba(255,255,255,0.06))",
                        border: isSelf ? "none" : "1px solid var(--wb-border)",
                        color: isSelf ? "#ffffff" : "var(--wb-text)",
                        boxShadow: isSelf
                          ? "0 2px 8px rgba(99, 102, 241, 0.3)"
                          : "0 1px 3px rgba(0,0,0,0.1)",
                        wordBreak: "break-word",
                        lineHeight: 1.45,
                        fontSize: 12,
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {errorNotice && (
            <div
              style={{
                padding: "6px 12px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                borderTop: "1px solid rgba(239, 68, 68, 0.25)",
                fontSize: 11,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {errorNotice}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: 12,
              borderTop: "1px solid var(--wb-border)",
              background: "var(--wb-surface)",
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                maxLength={2000}
                style={{
                  width: "100%",
                  padding: "8px 36px 8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  background: "var(--wb-surface-muted, rgba(0,0,0,0.05))",
                  border: "1px solid var(--wb-border)",
                  color: "var(--wb-text)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  position: "absolute",
                  right: 4,
                  padding: 6,
                  borderRadius: 8,
                  border: "none",
                  background: inputText.trim() ? "#6366f1" : "transparent",
                  color: inputText.trim() ? "#ffffff" : "var(--wb-muted)",
                  cursor: inputText.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 140ms ease",
                }}
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
