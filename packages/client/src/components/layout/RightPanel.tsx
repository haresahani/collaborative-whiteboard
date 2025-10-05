import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Info,
  Users,
  Send,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWhiteboard } from "@/contexts/WhiteboardContext";
import { User } from "@/types/whiteboard";

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock chat messages for demo
const mockMessages = [
  {
    id: "1",
    user: "Hare",
    message: "Great work on the wireframes!",
    timestamp: Date.now() - 120000,
  },
  {
    id: "2",
    user: "Harekrishna",
    message: "Should we add more details to the user flow?",
    timestamp: Date.now() - 60000,
  },
  {
    id: "3",
    user: "Rohini",
    message: "I like the color scheme we chose",
    timestamp: Date.now() - 30000,
  },
];

export function RightPanel({ isOpen, onClose }: RightPanelProps) {
  const { state } = useWhiteboard();
  const { users, elements } = state;
  const [chatMessage, setChatMessage] = React.useState("");

  const onlineUsers = Object.values(users).filter((user) => user.isOnline);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    // In a real app, this would send the message via WebSocket
    console.log("Sending message:", chatMessage);
    setChatMessage("");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-14 bottom-0 w-80 bg-surface border-l border-border-subtle z-50 lg:relative lg:top-0"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                <h3 className="font-semibold text-foreground">Board Info</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <Tabs defaultValue="users" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
                  <TabsTrigger value="users" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    Info
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="flex-1 mt-4">
                  <div className="px-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        Online ({onlineUsers.length})
                      </span>
                    </div>

                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {onlineUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-subtle transition-colors"
                          >
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.avatar}
                                  alt={user.name}
                                />
                                <AvatarFallback
                                  className="text-xs text-white"
                                  style={{ backgroundColor: user.color }}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface"
                                style={{ backgroundColor: user.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Active now
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Board Info Tab */}
                <TabsContent value="info" className="flex-1 mt-4">
                  <div className="px-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-subtle rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {elements.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Elements
                        </div>
                      </div>
                      <div className="p-3 bg-subtle rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {onlineUsers.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Collaborators
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">
                        Board Statistics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span className="text-foreground">2 hours ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last edit
                          </span>
                          <span className="text-foreground">5 minutes ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version</span>
                          <span className="text-foreground">v1.2.3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
                  <div className="flex-1 px-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {mockMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {msg.user}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground bg-subtle p-2 rounded">
                              {msg.message}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-border-subtle">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="flex-1"
                      />
                      <Button size="icon" onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
