import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Plus, Search, Clock, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { deleteBoardApi, fetchMyBoardsApi } from "../api/auth";

interface BoardMetadata {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
}

const LEGACY_STORAGE_KEY = "collab_whiteboard_recent_boards";

function getStorageKey(userId?: string | null): string {
  return userId
    ? `collab_whiteboard_recent_boards_${userId}`
    : "collab_whiteboard_recent_boards_guest";
}

function loadInitialBoards(userId?: string | null): BoardMetadata[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
  const key = getStorageKey(userId);
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function IndexPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [recentBoards, setRecentBoards] = useState<BoardMetadata[]>(() =>
    loadInitialBoards(user?.id),
  );

  // Sync authenticated user's real boards from REST API
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && user?.id) {
      void fetchMyBoardsApi().then((apiBoards) => {
        if (!isMounted) return;
        if (apiBoards && apiBoards.length > 0) {
          setRecentBoards(apiBoards);
          try {
            localStorage.setItem(getStorageKey(user.id), JSON.stringify(apiBoards));
          } catch {
            // ignore
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthenticated]);

  const saveBoards = (updated: BoardMetadata[]) => {
    setRecentBoards(updated);
    const key = getStorageKey(user?.id);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCreateBoard = () => {
    const newId = `board-${uuidv4().slice(0, 8)}`;
    const newBoard: BoardMetadata = {
      id: newId,
      name: `Untitled Whiteboard ${recentBoards.length + 1}`,
      updatedAt: new Date().toISOString(),
      itemCount: 0,
    };

    const updated = [newBoard, ...recentBoards];
    saveBoards(updated);
    navigate(`/${newId}`);
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardIdToDelete: string) => {
    e.stopPropagation();
    const updated = recentBoards.filter((b) => b.id !== boardIdToDelete);
    saveBoards(updated);

    // Delete from MongoDB database via API if authenticated
    void deleteBoardApi(boardIdToDelete);
  };

  const handleLogout = () => {
    logout();
    setRecentBoards([]);
  };

  const filteredBoards = recentBoards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2.5rem 2rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.2rem",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
            >
              <Pencil size={22} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Collaborative Whiteboard
              </h1>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                Real-time workspace for diagrams, notes, and ideas
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isAuthenticated && user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#1e293b",
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0" }}>
                    {user.displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "1px solid #334155",
                    color: "#94a3b8",
                    padding: "0.6rem 1rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "1px solid #334155",
                    color: "#f8fafc",
                    padding: "0.65rem 1.2rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                    border: "none",
                    color: "#ffffff",
                    padding: "0.65rem 1.2rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateBoard}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.4rem",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderRadius: "0.6rem",
                fontWeight: 600,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                transition: "transform 0.15s ease, background-color 0.15s ease",
              }}
            >
              <Plus size={18} />
              New Whiteboard
            </button>
          </div>
        </header>

        {/* Controls Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1",
              maxWidth: "380px",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              placeholder="Search whiteboards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem 0.65rem 2.6rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            {filteredBoards.length} board{filteredBoards.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Boards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredBoards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/${board.id}`)}
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "0.8rem",
                padding: "1.4rem",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "150px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e293b";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Pencil size={20} style={{ color: "#3b82f6", marginBottom: "0.8rem" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBoard(e, board.id)}
                      title="Delete whiteboard"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.15s ease, background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#64748b";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ExternalLink size={16} style={{ color: "#475569" }} />
                  </div>
                </div>
                <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.05rem", fontWeight: 600 }}>
                  {board.name}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginTop: "1.2rem",
                }}
              >
                <Clock size={14} />
                <span>Updated {new Date(board.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
