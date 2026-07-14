# Project Folder Structure

This document provides a tree view of the folders and files in the `collaborative-whiteboard` repository.

```text
├── @/
│   └── components/
│       └── ui/
│           ├── button.tsx
│           ├── input.tsx
│           └── label.tsx
├── docs/
│   ├── INTERVIEW_NOTES.md
│   ├── README.md
│   ├── architecture.md
│   ├── collaboration-model.md
│   ├── engineering-conventions.md
│   ├── package-responsibilities.md
│   ├── protocol.md
│   ├── runbook.md
│   ├── testing-guide.md
│   └── v1-scope.md
├── env/
│   ├── dev.env
│   └── prod.env
├── infra/
│   ├── grafana/
│   │   └── dashboards/
│   ├── k8s/
│   ├── prometheus/
│   └── README.md
├── packages/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.json
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── db.ts
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   └── validate.ts
│   │   │   ├── modules/
│   │   │   │   ├── asset/
│   │   │   │   │   ├── asset.controller.ts
│   │   │   │   │   ├── asset.model.ts
│   │   │   │   │   ├── asset.routes.ts
│   │   │   │   │   └── asset.service.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.middleware.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.validator.ts
│   │   │   │   ├── board/
│   │   │   │   │   ├── board.access.ts
│   │   │   │   │   ├── board.controller.ts
│   │   │   │   │   ├── board.model.ts
│   │   │   │   │   ├── board.routes.ts
│   │   │   │   │   ├── board.service.ts
│   │   │   │   │   └── board.validator.ts
│   │   │   │   ├── operations/
│   │   │   │   │   ├── oplog.controller.ts
│   │   │   │   │   └── oplog.model.ts
│   │   │   │   ├── snapshot/
│   │   │   │   │   └── snapshot.model.ts
│   │   │   │   └── user/
│   │   │   │       └── user.model.ts
│   │   │   ├── realtime/
│   │   │   ├── types/
│   │   │   │   ├── express.d.ts
│   │   │   │   └── jwt.types.ts
│   │   │   ├── utils/
│   │   │   │   ├── ApiError.ts
│   │   │   │   ├── ApiResponse.ts
│   │   │   │   └── asyncHandler.ts
│   │   │   ├── index.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── auth.test.ts
│   │   │   ├── board.test.ts
│   │   │   └── health.test.ts
│   │   ├── README.md
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── client/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── assets.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── boards.ts
│   │   │   │   ├── client.ts
│   │   │   │   └── ws.ts
│   │   │   ├── app/
│   │   │   │   ├── App.tsx
│   │   │   │   ├── providers.tsx
│   │   │   │   └── router.tsx
│   │   │   ├── features/
│   │   │   │   └── whiteboard/
│   │   │   │       ├── components/
│   │   │   │       │   ├── canvas/
│   │   │   │       │   │   └── WhiteboardCanvas.tsx
│   │   │   │       │   ├── layout/
│   │   │   │       │   │   ├── lefttool/
│   │   │   │       │   │   │   ├── LeftToolbar.tsx
│   │   │   │       │   │   │   ├── index.ts
│   │   │   │       │   │   │   └── lefttoolData.ts
│   │   │   │       │   │   ├── BoardSettingsPanel.tsx
│   │   │   │       │   │   ├── BottomToolbar.tsx
│   │   │   │       │   │   ├── RightPanel.tsx
│   │   │   │       │   │   ├── TopNavigation.tsx
│   │   │   │       │   │   └── uiData.ts
│   │   │   │       │   ├── overlays/
│   │   │   │       │   │   ├── PresenceCursor.tsx
│   │   │   │       │   │   ├── SelectionBox.tsx
│   │   │   │       │   │   ├── SelectionPropertyCards.tsx
│   │   │   │       │   │   ├── TextEditor.tsx
│   │   │   │       │   │   └── WorkspaceOverlay.tsx
│   │   │   │       │   ├── toolbar/
│   │   │   │       │   │   └── Toolbar.tsx
│   │   │   │       │   └── WhiteboardPage.tsx
│   │   │   │       ├── engine/
│   │   │   │       │   ├── __tests__/
│   │   │   │       │   │   ├── clipboard.test.ts
│   │   │   │       │   │   └── viewport.test.ts
│   │   │   │       │   ├── bindings/
│   │   │   │       │   │   ├── arrowBinding.ts
│   │   │   │       │   │   ├── findBindableElement.ts
│   │   │   │       │   │   └── updateArrowBindings.ts
│   │   │   │       │   ├── geometry/
│   │   │   │       │   │   ├── bounds.ts
│   │   │   │       │   │   ├── hitTest.ts
│   │   │   │       │   │   ├── intersects.ts
│   │   │   │       │   │   └── resizeHandles.ts
│   │   │   │       │   ├── mutations/
│   │   │   │       │   │   ├── __tests__/
│   │   │   │       │   │   │   └── mutations.test.ts
│   │   │   │       │   │   ├── alignElements.ts
│   │   │   │       │   │   ├── deleteElements.ts
│   │   │   │       │   │   ├── duplicateElements.ts
│   │   │   │       │   │   ├── index.ts
│   │   │   │       │   │   ├── resizeElements.ts
│   │   │   │       │   │   ├── setElementStyle.ts
│   │   │   │       │   │   └── translateElements.ts
│   │   │   │       │   ├── operations/
│   │   │   │       │   │   ├── applyOperation.ts
│   │   │   │       │   │   ├── replayOperations.ts
│   │   │   │       │   │   └── serializeOperation.ts
│   │   │   │       │   ├── shapes/
│   │   │   │       │   │   ├── Shape.ts
│   │   │   │       │   │   ├── applyLineStyle.ts
│   │   │   │       │   │   ├── arrowShape.ts
│   │   │   │       │   │   ├── attachmentShape.ts
│   │   │   │       │   │   ├── imageShape.ts
│   │   │   │       │   │   ├── rectangleShape.ts
│   │   │   │       │   │   ├── shapeRegistry.ts
│   │   │   │       │   │   ├── strokeShape.ts
│   │   │   │       │   │   └── textShape.ts
│   │   │   │       │   ├── snapping/
│   │   │   │       │   │   ├── snapGuids.ts
│   │   │   │       │   │   ├── snapToElements.ts
│   │   │   │       │   │   └── snapToGrid.ts
│   │   │   │       │   ├── clipboard.ts
│   │   │   │       │   ├── grid.ts
│   │   │   │       │   ├── renderer.ts
│   │   │   │       │   ├── smoothing.ts
│   │   │   │       │   └── viewport.ts
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── useCanvas.ts
│   │   │   │       │   ├── useKeyboardShortcuts.ts
│   │   │   │       │   ├── usePanelFocus.ts
│   │   │   │       │   └── useToolSession.ts
│   │   │   │       ├── models/
│   │   │   │       │   ├── boardModel.ts
│   │   │   │       │   ├── element.ts
│   │   │   │       │   └── stroke.ts
│   │   │   │       ├── pages/
│   │   │   │       ├── store/
│   │   │   │       │   ├── __tests__/
│   │   │   │       │   │   └── historyStore.test.ts
│   │   │   │       │   ├── boardStore.ts
│   │   │   │       │   ├── historyStore.ts
│   │   │   │       │   ├── selectionStore.ts
│   │   │   │       │   ├── textEditorStore.ts
│   │   │   │       │   ├── toolStore.ts
│   │   │   │       │   └── viewportStore.ts
│   │   │   │       ├── tools/
│   │   │   │       │   ├── __tests__/
│   │   │   │       │   │   └── tools.test.ts
│   │   │   │       │   ├── eraser/
│   │   │   │       │   │   ├── eraseLogic.ts
│   │   │   │       │   │   ├── index.ts
│   │   │   │       │   │   └── useEraserTrail.ts
│   │   │   │       │   ├── eraserTool.ts
│   │   │   │       │   ├── marqueeTool.ts
│   │   │   │       │   ├── moveTool.ts
│   │   │   │       │   ├── penTool.ts
│   │   │   │       │   ├── resizeTool.ts
│   │   │   │       │   ├── shapeTool.ts
│   │   │   │       │   ├── toolRegistry.ts
│   │   │   │       │   └── types.ts
│   │   │   │       ├── types/
│   │   │   │       │   └── whiteboardTypes.ts
│   │   │   │       └── utils/
│   │   │   │           └── snapshotStorage.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useMobile.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts
│   │   │   │   └── utils.ts
│   │   │   ├── pages/
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── NotFound.tsx
│   │   │   │   └── Signup.tsx
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   └── tailwind.css
│   │   │   ├── types/
│   │   │   │   ├── auth.ts
│   │   │   │   └── protocol.ts
│   │   │   ├── main.tsx
│   │   │   └── vite.env.d.ts
│   │   ├── README.md
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   ├── infra-utils/
│   │   ├── scripts/
│   │   │   └── seed-db.ts
│   │   ├── src/
│   │   │   ├── ci/
│   │   │   │   └── githubActionsHelper.ts
│   │   │   ├── monitoring/
│   │   │   │   └── prometheusConfig.ts
│   │   │   └── index.ts
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   └── index.ts
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── socket/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── README.md
│   │   │   ├── events/
│   │   │   │   └── README.md
│   │   │   ├── middleware/
│   │   │   ├── rooms/
│   │   │   │   └── README.md
│   │   │   ├── services/
│   │   │   │   └── README.md
│   │   │   ├── utils/
│   │   │   │   └── README.md
│   │   │   ├── index.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   └── README.md
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── worker/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── README.md
├── scripts/
│   └── README.md
├── tests/
│   ├── chaos/
│   ├── e2e/
│   ├── load/
│   └── README.md
├── tools/
│   └── README.md
├── LICENSE
├── MAINTAINING.md
├── README.md
├── dev-commands.sh
├── eslint.config.js
├── lint-staged.config.mjs
├── package.json
├── pnpm-workspace.yaml
├── test-socket-server.js
├── tsconfig.base.json
├── tsconfig.eslint.json
└── tsconfig.json
```

## Description of Main Directories

- **`@/`**: Project root-level imports/components.
- **`docs/`**: Core project documentation explaining architecture, protocol, runbooks, and conventions.
- **`env/`**: Environment configuration files (e.g. `dev.env`, `prod.env`).
- **`infra/`**: Infrastructure configuration (Kubernetes, Prometheus, Grafana dashboards).
- **`packages/`**: Monorepo packages:
  - **`api/`**: Auth endpoints, board CRUD, persistence (Prisma/Postgres).
  - **`client/`**: React/Vite client frontend whiteboard application.
  - **`infra-utils/`**: Database seeding and utility scripts.
  - **`shared/`**: Shared TypeScript types and validation helpers.
  - **`socket/`**: Socket.IO collaborative real-time server.
  - **`worker/`**: Stub package for future background workers.
- **`scripts/`**: Miscellaneous automation and utility scripts.
- **`tests/`**: Integration/system tests (chaos, load, e2e tests).
- **`tools/`**: Tooling scripts and helper configurations.
