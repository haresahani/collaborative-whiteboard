import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useCollaborationStore } from "../../store/collaborationStore";
import { socketService } from "../../../../api/ws";
import { getUserAccent } from "@shared/utils/accent";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const messages = useCollaborationStore((state) => state.chatMessages);
  const [inputValue, setInputValue] = useState("");
  const [errorText, setErrorText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll to the bottom when messages update or panel opens
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const res = socketService.sendChatMessage(trimmed);
    if (!res.ok) {
      setErrorText(res.error || "Failed to send message");
      const timeoutId = setTimeout(() => setErrorText(""), 3000);
      return () => clearTimeout(timeoutId);
    } else {
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop",
          isOpen && "wb-overlay-backdrop--open",
        )}
        onClick={onClose}
        aria-label="Close board chat"
      />

      <aside
        id="board-chat-panel"
        className={cn("wb-right-panel", isOpen && "wb-right-panel--open")}
        aria-hidden={!isOpen}
        role="dialog"
        tabIndex={-1}
      >
        <div className="wb-right-panel__shell">
          <div className="wb-right-panel__header">
            <div className="wb-right-panel__heading">
              <MessageSquare size={16} />
              <h3 className="wb-right-panel__title">Board Chat</h3>
            </div>
            <button
              type="button"
              className="wb-icon-button wb-icon-button--small"
              onClick={onClose}
              aria-label="Close board chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="wb-chat-container">
            <div ref={listRef} className="wb-chat-messages">
              {messages.length === 0 ? (
                <div className="wb-chat-empty">
                  <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const accent = getUserAccent(msg.userId);
                  const isMe = msg.userId === socketService.getUserId();
                  const time = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg._id || index}
                      className={cn(
                        "wb-chat-message-row",
                        isMe && "wb-chat-message-row--me",
                      )}
                    >
                      {!isMe && (
                        <span
                          className="wb-chat-avatar"
                          style={{ backgroundColor: accent }}
                        >
                          {msg.displayName.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <div className="wb-chat-bubble-container">
                        {!isMe && (
                          <span
                            className="wb-chat-sender-name"
                            style={{ color: accent }}
                          >
                            {msg.displayName}
                          </span>
                        )}
                        <div className="wb-chat-bubble">
                          <p className="wb-chat-text">{msg.message}</p>
                          <span className="wb-chat-time">{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="wb-chat-input-container">
              {errorText ? <div className="wb-chat-error">{errorText}</div> : null}
              <div className="wb-chat-input-row">
                <input
                  type="text"
                  className="wb-chat-input"
                  placeholder="Type a message..."
                  maxLength={2000}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="wb-chat-send-btn"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  title="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="wb-chat-input-footer">
                <span>{inputValue.length} / 2000</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
