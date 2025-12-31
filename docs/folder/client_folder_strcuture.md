client/
├── .gitignore
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── jest.config.ts
├── jest.setup.ts
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.eslint.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.js
├── vite.config.ts
├── vitest.config.ts
│
├── public/
│ ├── favicon.png
│ ├── og-image.png
│ ├── placeholder.svg
│ └── robots.txt
│
├── src/
│ ├── App.css
│ ├── App.tsx
│ ├── index.css
│ ├── main.tsx
│ ├── vite-env.d.ts
│ │
│ ├── api/
│ │ ├── auth.ts
│ │ ├── whiteboard.ts
│ │ └── ws.ts
│ │
│ ├── components/
│ │ ├── auth/
│ │ │ └── AuthDialog.tsx
│ │ │
│ │ ├── canvas/
│ │ │ ├── PresenceCursors.tsx
│ │ │ ├── SelectionBox.tsx
│ │ │ └── WhiteboardCanvas.tsx
│ │ │
│ │ ├── layout/
│ │ │ ├── BottomToolbar.tsx
│ │ │ ├── LeftSidebar.tsx
│ │ │ ├── LeftSidebarItem.tsx
│ │ │ ├── LeftToolbar.tsx
│ │ │ ├── MobileToolTray.tsx
│ │ │ ├── RightPanel.tsx
│ │ │ └── TopNavigation.tsx
│ │ │
│ │ └── ui/
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
│ ├── config/
│ │ └── constants.ts
│ │
│ ├── contexts/
│ │ ├── AuthContext.tsx
│ │ └── WhiteboardContext.tsx
│ │
│ ├── hooks/
│ │ ├── use-mobile.tsx
│ │ ├── use-toast.ts
│ │ ├── useAuth.ts
│ │ ├── useKeyboardShortcuts.ts
│ │ └── useWebSocket.ts
│ │
│ ├── lib/
│ │ ├── clipboard.ts
│ │ ├── hit.ts
│ │ ├── transform.ts
│ │ └── utils.ts
│ │
│ ├── pages/
│ │ ├── Index.tsx
│ │ ├── Login.tsx
│ │ ├── Signup.tsx
│ │ ├── Whiteboard.tsx
│ │ └── NotFound.tsx
│ │
│ ├── store/
│ │ ├── whiteboardElementsStore.ts
│ │ └── whiteboardStore.ts
│ │
│ └── types/
│ ├── auth.ts
│ └── whiteboard.ts
│
├── tests/
│ ├── components/
│ │ └── Button.test.tsx
│ │
│ ├── mocks/
│ │ └── constants.ts
│ │
│ ├── pages/
│ │ └── Whiteboard.test.tsx
│ │
│ ├── utils/
│ │ └── api.test.ts
│ │
│ ├── setupJest.ts
│ └── setupTests.ts
