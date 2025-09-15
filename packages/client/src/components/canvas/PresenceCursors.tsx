import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';

export function PresenceCursors() {
  const { state } = useWhiteboard();
  const { users, currentUser } = state;

  // Filter out current user and users without cursor positions
  const otherUsersWithCursors = Object.values(users).filter(
    user => user.id !== currentUser?.id && user.cursor && user.isOnline
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {otherUsersWithCursors.map(user => (
          <motion.div
            key={`cursor-${user.id}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: user.cursor!.x,
              y: user.cursor!.y,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 350,
              duration: 0.1
            }}
            className="absolute presence-cursor"
            style={{ left: 0, top: 0 }}
          >
            {/* Cursor pointer */}
            <div className="relative">
              <MousePointer2 
                className="w-5 h-5 -rotate-12 drop-shadow-lg"
                style={{ color: user.color }}
                fill={user.color}
              />
              
              {/* User name label */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-6 top-0 whitespace-nowrap"
              >
                <div 
                  className="collaboration-badge shadow-sm"
                  style={{ 
                    backgroundColor: user.color,
                    color: 'white',
                    borderColor: user.color 
                  }}
                >
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