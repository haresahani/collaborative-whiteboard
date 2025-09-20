// src/components/canvas/PresenceCursors.tsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import { useWhiteboard } from "@/contexts/WhiteboardContext";

export function PresenceCursors() {
  const { state } = useWhiteboard();
  const { users, currentUser } = state;

  const otherUsersWithCursors = useMemo(
    () => Object.values(users).filter((u) => u.id !== currentUser?.id && !!u.cursor && u.isOnline),
    [users, currentUser]
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {otherUsersWithCursors.map((user) => (
          <motion.div
            key={`cursor-${user.id}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, x: user.cursor!.x, y: user.cursor!.y }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute"
            style={{ left: 0, top: 0 }}
          >
            <div className="relative">
              <MousePointer2 className="w-5 h-5 -rotate-12 drop-shadow-lg" style={{ color: user.color }} fill={user.color} />
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute left-6 top-0 whitespace-nowrap">
                <div className="collaboration-badge shadow-sm px-2 py-1 rounded text-white text-xs font-medium" style={{ backgroundColor: user.color }}>
                  {user.name}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
