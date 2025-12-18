client/
│── .gitignore # Git ignore rules
│── README.md # Project documentation
│── bun.lockb # Bun lockfile for dependencies
│── components.json # ShadCN UI component registry
│── eslint.config.js # ESLint configuration
│── index.html # App HTML entry point
│── package-lock.json # NPM lockfile
│── package.json # Project metadata & dependencies
│── postcss.config.js # PostCSS configuration
│── tailwind.config.ts # TailwindCSS configuration
│── tsconfig.app.json # TS config for application code
│── tsconfig.json # Root TypeScript configuration
│── tsconfig.node.json # TS config for Node build tools
│── vite.config.ts # Vite bundler configuration
│
├── public/
│ ├── favicon.ico # Browser tab icon
│ ├── placeholder.svg # Placeholder image
│ └── robots.txt # SEO crawler rules
│
├── src/
│ │── App.css # App-level styles
│ │── App.tsx # Main App component
│ │── index.css # Global CSS (Tailwind base)
│ │── main.tsx # React entry point with Vite
│ │── vite-env.d.ts # Vite TypeScript env types
│ │
│ ├── api/  
│ │ ├── auth.ts # Auth API (login, signup, logout, refresh)
│ │ ├── whiteboard.ts # Whiteboard APIs (fetch, save, list)
│ │ └── ws.ts # WebSocket connection manager
│ │
│ ├── assets/  
│ │ └── logo.svg # App logo
│ │
│ ├── components/
│ │ ├── auth/
│ │ │ └── AuthDialog.tsx # Auth modal dialog
│ │ ├── canvas/
│ │ │ ├── PresenceCursors.tsx # Show live user cursors
│ │ │ ├── WhiteboardCanvas.tsx # Main drawing canvas
│ │ │ └── Toolbar.tsx # Canvas toolbar
│ │ ├── layout/
│ │ │ ├── BottomToolbar.tsx # Toolbar at bottom
│ │ │ ├── LeftToolbar.tsx # Sidebar tools
│ │ │ ├── RightPanel.tsx # Properties/Inspector panel
│ │ │ └── TopNavigation.tsx # Top navigation bar
| | | |** LeftSidebarItem.tsx
| | | |** MobileToolTray.tsx
| | | |** LeftSidebar.tsx
│ │ └── ui/ # Generic ShadCN UI components
│ │ ├── accordion.tsx
│ │ ├── alert-dialog.tsx
│ │ ├── alert.tsx
│ │ ├── aspect-ratio.tsx
│ │ ├── avatar.tsx
│ │ ├── badge.tsx
│ │ ├── breadcrumb.tsx
│ │ ├── button.tsx
│ │ ├── calendar.tsx
│ │ ├── card.tsx
│ │ ├── carousel.tsx
│ │ ├── chart.tsx
│ │ ├── checkbox.tsx
│ │ ├── collapsible.tsx
│ │ ├── command.tsx
│ │ ├── context-menu.tsx
│ │ ├── dialog.tsx
│ │ ├── drawer.tsx
│ │ ├── dropdown-menu.tsx
│ │ ├── form.tsx
│ │ ├── hover-card.tsx
│ │ ├── input-otp.tsx
│ │ ├── input.tsx
│ │ ├── label.tsx
│ │ ├── menubar.tsx
│ │ ├── navigation-menu.tsx
│ │ ├── pagination.tsx
│ │ ├── popover.tsx
│ │ ├── progress.tsx
│ │ ├── radio-group.tsx
│ │ ├── resizable.tsx
│ │ ├── scroll-area.tsx
│ │ ├── select.tsx
│ │ ├── separator.tsx
│ │ ├── sheet.tsx
│ │ ├── sidebar.tsx
│ │ ├── skeleton.tsx
│ │ ├── slider.tsx
│ │ ├── sonner.tsx
│ │ ├── switch.tsx
│ │ ├── table.tsx
│ │ ├── tabs.tsx
│ │ ├── textarea.tsx
│ │ ├── theme-provider.tsx
│ │ ├── theme-toggle.tsx
│ │ ├── toast.tsx
│ │ ├── toaster.tsx
│ │ ├── toggle-group.tsx
│ │ ├── toggle.tsx
│ │ ├── tooltip.tsx
│ │ └── use-toast.ts
│ │
│ ├── contexts/
│ │ ├── AuthContext.tsx # Provides authentication state
│ │ └── WhiteboardContext.tsx # Provides whiteboard state
│ │
│ ├── hooks/
│ │ ├── use-mobile.tsx # Detect mobile device
│ │ ├── use-toast.ts # Toast notifications
│ │ ├── useKeyboardShortcuts.ts # Keyboard shortcuts handler
│ │ ├── useWebSocket.ts # WebSocket hook for real-time sync
│ │ └── useAuth.ts # Authentication hook
│ │
│ ├── lib/
│ │ ├── utils.ts # Helper utilities
| | |** clipboard.ts
| | |** hit.ts
| | |** transform.ts
│ │
│ ├── store/
│ │ └── whiteboardStore.ts # Zustand/Redux store for whiteboard
| | |** whiteboardElementsStore.ts
│ │
│ ├── pages/
│ │ ├── Index.tsx # Landing page
│ │ ├── NotFound.tsx # 404 fallback page
│ │ └── Whiteboard.tsx # Whiteboard page
| | |** Login.tsx
| | |\_\_ Signup.tsx
│ │
│ ├── types/
│ │ ├── whiteboard.ts # Whiteboard-related types
│ │ └── auth.ts # Auth-related types
│ │
│ └── config/
│ └── constants.ts # Config constants (API URL, envs)
