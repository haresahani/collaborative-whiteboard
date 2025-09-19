src/
│── App.tsx
│── main.tsx
│── index.css
│
├── api/                     # API service layer (REST + WebSocket)
│   ├── auth.ts              # login, signup, logout, refresh
│   ├── whiteboard.ts        # fetch, save, list boards
│   └── ws.ts                # WebSocket connection manager
│
├── assets/                  # Static images, logos, icons
│   └── logo.svg
│
├── components/              # Reusable UI + feature components
│   ├── auth/
│   │   └── AuthDialog.tsx
│   ├── canvas/
│   │   ├── WhiteboardCanvas.tsx
│   │   ├── PresenceCursors.tsx
│   │   └── Toolbar.tsx
│   ├── layout/
│   │   ├── TopNavigation.tsx
│   │   ├── LeftToolbar.tsx
│   │   ├── BottomToolbar.tsx
│   │   └── RightPanel.tsx
│   └── ui/                  # (already have shadcn UI components)
│
├── contexts/                # Global app contexts
│   ├── AuthContext.tsx      # user auth state
│   └── WhiteboardContext.tsx
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts           # handles login/logout via AuthContext
│   ├── useWebSocket.ts      # wraps ws events
│   ├── useKeyboardShortcuts.ts
│   └── useToast.ts
│
├── lib/                     # Helpers & utils
│   ├── crdt.ts              # setup Yjs/Automerge for sync
│   └── utils.ts
│
├── pages/                   # Route pages
│   ├── Index.tsx            # landing page
│   ├── Whiteboard.tsx       # actual board
│   └── NotFound.tsx
│
├── store/                   # (Optional: Zustand/Redux for state)
│   └── whiteboardStore.ts
│
├── types/                   # TypeScript types
│   ├── auth.ts              # User, Session
│   └── whiteboard.ts        # Board, Shape, Cursor
│
└── config/                  # Configs (API URL, envs)
    └── constants.ts
