import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { useCollaborationStore } from "../../store/collaborationStore";
import { useViewportStore } from "../../store/viewportStore";
import { worldToScreen } from "../../engine/viewport";

export default function LiveCursorsOverlay() {
  const cursors = useCollaborationStore((state) => state.cursors);
  const activeUsers = useCollaborationStore((state) => state.activeUsers);

  // Subscribe to changes in viewport (pan & zoom) to translate cursor positions accurately
  const offsetX = useViewportStore((state) => state.offsetX);
  const offsetY = useViewportStore((state) => state.offsetY);
  const zoom = useViewportStore((state) => state.zoom);

  // eslint-disable-next-line react-hooks/purity
  const [now, setNow] = useState(Date.now());

  // Periodically update local clock to filter out stale cursor broadcasts (idle timeout)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCursors = Object.values(cursors).filter((c) => {
    const isStale = now - c.updatedAt > 10000; // stale if no move events for 10 seconds
    const isOnline = activeUsers.some((u) => u.userId === c.userId);
    return !isStale && isOnline;
  });

  return (
    <div className="wb-live-cursors-layer">
      {activeCursors.map((cursor) => {
        const screenPos = worldToScreen(
          { x: cursor.x, y: cursor.y },
          { offsetX, offsetY, zoom },
        );

        return (
          <div
            key={cursor.userId}
            className="wb-live-cursor"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              color: cursor.accent,
            }}
          >
            <MousePointer2
              className="wb-live-cursor__icon"
              style={{
                fill: cursor.accent,
              }}
            />
            <span
              className="wb-live-cursor__badge"
              style={{
                backgroundColor: cursor.accent,
              }}
            >
              {cursor.displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
