# Future Concept

1. In Text element area: while typing the software suggest next word.
2. AI - give drawing prompt and that ai will draw that drawing.
3. Edit, Present and History.

# Element

ellipse
diamond
line
polygon
image
video
sticky notes
frames
groups
connectors
mindmap nodes
flowchart blocks

client
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── src
│ ├── api
│ │ ├── auth.ts
│ │ ├── boards.ts
│ │ ├── client.ts
│ │ └── ws.ts
│ │
│ ├── app
│ │ ├── App.tsx
│ │ ├── providers.tsx
│ │ └── router.tsx
│ │
│ ├── features
│ │ └── whiteboard
│ │ ├── components
│ │ │ ├── WhiteboardPage.tsx
│ │ │ ├── canvas
│ │ │ │ └── WhiteboardCanvas.tsx
│ │ │ ├── overlays
│ │ │ │ ├── PresenceCursor.tsx
│ │ │ │ ├── SelectionBox.tsx
│ │ │ │ └── TextEditor.tsx
│ │ │ └── toolbar
│ │ │ └── Toolbar.tsx
│ │ │
│ │ ├── engine
│ │ │ ├── drawingEngine.ts
│ │ │ ├── grid.ts
│ │ │ ├── renderer.ts
│ │ │ ├── smoothing.ts
│ │ │
│ │ │ ├── geometry
│ │ │ │ ├── bounds.ts
│ │ │ │ ├── hitTest.ts
│ │ │ │ ├── intersects.ts
│ │ │ │ └── resizeHandles.ts
│ │ │
│ │ │ ├── operations
│ │ │ │ ├── applyOperation.ts
│ │ │ │ ├── replayOperations.ts
│ │ │ │ └── serializeOperation.ts
│ │ │
│ │ │ ├── shapes
│ │ │ │ ├── Shape.ts
│ │ │ │ ├── arrowShape.ts
│ │ │ │ ├── rectangleShape.ts
│ │ │ │ ├── shapeRegistry.ts
│ │ │ │ ├── strokeShape.ts
│ │ │ │ └── textShape.ts
│ │ │
│ │ │ └── snapping
│ │ │ ├── snapGuids.ts
│ │ │ ├── snapToElements.ts
│ │ │ └── snapToGrid.ts
│ │
│ │ ├── hooks
│ │ │ ├── useCanvas.ts
│ │ │ ├── useKeyboardShortcuts.ts
│ │ │ └── usePointerDraw.ts
│ │
│ │ ├── models
│ │ │ ├── boardModel.ts
│ │ │ ├── element.ts
│ │ │ └── stroke.ts
│ │
│ │ ├── store
│ │ │ ├── boardStore.ts
│ │ │ ├── historyStore.ts
│ │ │ ├── selectionStore.ts
│ │ │ ├── textEditorStore.ts
│ │ │ ├── toolStore.ts
│ │ │ └── viewportStore.ts
│ │
│ │ ├── tools
│ │ │ ├── eraserTool.ts
│ │ │ ├── penTool.ts
│ │ │ └── selectTool.ts
│ │
│ │ ├── types
│ │ │ └── whiteboardTypes.ts
│ │
│ │ └── utils
│ │ └── snapshotStorage.ts
│
│ ├── hooks
│ │ ├── useAuth.ts
│ │ ├── useMobile.ts
│ │ └── useWebSocket.ts
│
│ ├── lib
│ │ ├── clipboard.ts
│ │ ├── logger.ts
│ │ └── utils.ts
│
│ ├── main.tsx
│
│ ├── pages
│ │ ├── Index.tsx
│ │ ├── Login.tsx
│ │ ├── NotFound.tsx
│ │ └── Signup.tsx
│
│ ├── styles
│ │ ├── globals.css
│ │ └── tailwind.css
│
│ ├── types
│ │ ├── auth.ts
│ │ └── protocol.ts
│
│ └── vite.env.d.ts
│
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
