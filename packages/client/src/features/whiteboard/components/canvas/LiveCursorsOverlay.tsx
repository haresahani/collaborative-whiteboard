import { useCollaborationStore } from "../../store/collaborationStore";

const CURSOR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

function hashColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export default function LiveCursorsOverlay() {
  const cursors = useCollaborationStore((state) => state.cursors);

  return (
    <div
      className="live-cursors-overlay"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {Array.from(cursors.values()).map((cursor) => {
        const color = cursor.accent || hashColor(cursor.userId);
        return (
          <div
            key={cursor.userId}
            style={{
              position: "absolute",
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-2px, -2px)",
              transition: "left 80ms linear, top 80ms linear",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            {/* Cursor SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2L7.5 16L10 10L16 7.5L2 2Z"
                fill={color}
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            {/* Name label */}
            <span
              style={{
                background: color,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                whiteSpace: "nowrap",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                letterSpacing: "0.01em",
                fontFamily: "Inter, sans-serif",
                marginLeft: 6,
                marginTop: -2,
              }}
            >
              {cursor.displayName || "Guest"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
