import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, Settings, Menu, Users, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useWhiteboard } from '@/contexts/WhiteboardContext';

interface TopNavigationProps {
  boardName: string;
  onBoardNameChange: (name: string) => void;
  onShare: () => void;
  onExport: () => void;
  onSettings: () => void;
  onToggleSidebar?: () => void;
}

export function TopNavigation({
  boardName,
  onBoardNameChange,
  onShare,
  onExport,
  onSettings,
  onToggleSidebar,
}: TopNavigationProps) {
  const { state } = useWhiteboard();
  const { currentUser, users, isConnected } = state;
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(boardName);

  const handleNameSubmit = () => {
    onBoardNameChange(tempName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setTempName(boardName);
      setIsEditingName(false);
    }
  };

  const onlineUsersCount = Object.values(users).filter(user => user.isOnline).length;

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between h-14 px-4 bg-surface border-b border-border-subtle backdrop-blur-sm"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <span className="font-semibold text-foreground hidden sm:block">Whiteboard</span>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Board Name */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              className="bg-transparent border-none outline-none text-foreground font-medium text-sm min-w-0 max-w-48"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-foreground font-medium text-sm hover:bg-subtle px-2 py-1 rounded transition-colors truncate max-w-48"
            >
              {boardName}
            </button>
          )}
        </div>
      </div>

      {/* Center Section - Connection Status & Users */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 text-success">
              <Wifi className="h-3 w-3" />
              <span className="text-xs font-medium hidden sm:block">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <WifiOff className="h-3 w-3" />
              <span className="text-xs font-medium hidden sm:block">Offline</span>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {onlineUsersCount}
          </Badge>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onShare} className="hidden sm:flex">
          <Share2 className="h-4 w-4 mr-1.5" />
          Share
        </Button>

        <Button variant="ghost" size="sm" onClick={onExport} className="hidden sm:flex">
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>

        <ThemeToggle />

        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* User Avatar */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="text-xs" style={{ backgroundColor: currentUser.color }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden lg:block">
              {currentUser.name}
            </span>
          </div>
        )}
      </div>
    </motion.header>
  );
}