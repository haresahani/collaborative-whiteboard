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
│   ├── OBSERVABILITY.md
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
│   ├── docker.env
│   └── prod.env
├── infra/
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── dashboards/
│   │       │   ├── dashboards.yml
│   │       │   └── whiteboard-dashboard.json
│   │       └── datasources/
│   │           └── prometheus.yml
│   ├── helm/
│   │   └── collaborative-whiteboard/
│   │       ├── templates/
│   │       │   ├── _helpers.tpl
│   │       │   ├── api-deployment.yaml
│   │       │   ├── api-service.yaml
│   │       │   ├── client-deployment.yaml
│   │       │   ├── client-service.yaml
│   │       │   ├── configmap.yaml
│   │       │   ├── hpa.yaml
│   │       │   ├── ingress.yaml
│   │       │   ├── socket-deployment.yaml
│   │       │   ├── socket-service.yaml
│   │       │   └── worker-deployment.yaml
│   │       ├── Chart.yaml
│   │       ├── values-staging.yaml
│   │       └── values.yaml
│   ├── k8s/
│   │   └── staging/
│   │       └── deployment-staging.yaml
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── README.md
│   ├── docker-compose.chaos.yml
│   └── docker-compose.yml
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
│   │   │   │   ├── audit/
│   │   │   │   │   ├── audit.controller.ts
│   │   │   │   │   ├── audit.routes.ts
│   │   │   │   │   └── audit.service.ts
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
│   │   │   ├── auditLog.test.ts
│   │   │   ├── auth.test.ts
│   │   │   ├── board.test.ts
│   │   │   ├── health.test.ts
│   │   │   ├── rateLimiter.test.ts
│   │   │   └── securityHeaders.test.ts
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.build.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.test.json
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
│   │   │   │       │   │   ├── LiveCursorsOverlay.tsx
│   │   │   │       │   │   └── WhiteboardCanvas.tsx
│   │   │   │       │   ├── layout/
│   │   │   │       │   │   ├── lefttool/
│   │   │   │       │   │   │   ├── LeftToolbar.tsx
│   │   │   │       │   │   │   ├── index.ts
│   │   │   │       │   │   │   └── lefttoolData.ts
│   │   │   │       │   │   ├── BoardSettingsPanel.tsx
│   │   │   │       │   │   ├── BottomToolbar.tsx
│   │   │   │       │   │   ├── ChatPanel.tsx
│   │   │   │       │   │   ├── RightPanel.tsx
│   │   │   │       │   │   ├── TopNavigation.tsx
│   │   │   │       │   │   └── uiData.ts
│   │   │   │       │   ├── overlays/
│   │   │   │       │   │   ├── PresenceCursor.tsx
│   │   │   │       │   │   ├── SelectionBox.tsx
│   │   │   │       │   │   ├── SelectionPropertyCards.tsx
│   │   │   │       │   │   ├── StickyTextEditor.tsx
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
│   │   │   │       │   │   ├── ellipseShape.ts
│   │   │   │       │   │   ├── imageShape.ts
│   │   │   │       │   │   ├── pathShape.ts
│   │   │   │       │   │   ├── rectangleShape.ts
│   │   │   │       │   │   ├── shapeRegistry.ts
│   │   │   │       │   │   ├── stickyShape.ts
│   │   │   │       │   │   ├── strokeShape.ts
│   │   │   │       │   │   └── textShape.ts
│   │   │   │       │   ├── snapping/
│   │   │   │       │   │   ├── snapGuids.ts
│   │   │   │       │   │   ├── snapToElements.ts
│   │   │   │       │   │   └── snapToGrid.ts
│   │   │   │       │   ├── clipboard.ts
│   │   │   │       │   ├── grid.ts
│   │   │   │       │   ├── renderWorker.ts
│   │   │   │       │   ├── renderer.ts
│   │   │   │       │   ├── smoothing.ts
│   │   │   │       │   └── viewport.ts
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── useCanvas.ts
│   │   │   │       │   ├── useKeyboardShortcuts.ts
│   │   │   │       │   ├── useOffscreenCanvas.ts
│   │   │   │       │   ├── usePanelFocus.ts
│   │   │   │       │   └── useToolSession.ts
│   │   │   │       ├── models/
│   │   │   │       │   ├── boardModel.ts
│   │   │   │       │   ├── element.ts
│   │   │   │       │   └── stroke.ts
│   │   │   │       ├── services/
│   │   │   │       │   └── yjsService.ts
│   │   │   │       ├── store/
│   │   │   │       │   ├── __tests__/
│   │   │   │       │   │   └── historyStore.test.ts
│   │   │   │       │   ├── boardStore.ts
│   │   │   │       │   ├── collaborationStore.ts
│   │   │   │       │   ├── historyStore.ts
│   │   │   │       │   ├── selectionStore.ts
│   │   │   │       │   ├── stickyEditorStore.ts
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
│   │   │   │           ├── sampling.test.ts
│   │   │   │           ├── sampling.ts
│   │   │   │           ├── smoothing.test.ts
│   │   │   │           ├── smoothing.ts
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
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── nginx.conf
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
│   │   │   ├── health/
│   │   │   │   ├── health.test.ts
│   │   │   │   └── health.ts
│   │   │   ├── logging/
│   │   │   │   ├── logger.ts
│   │   │   │   └── requestId.ts
│   │   │   ├── monitoring/
│   │   │   │   ├── metrics.test.ts
│   │   │   │   └── metrics.ts
│   │   │   ├── tracing/
│   │   │   │   └── telemetry.ts
│   │   │   └── index.ts
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   ├── models/
│   │   │   │   ├── auditLog.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── oplog.model.ts
│   │   │   │   ├── snapshot.model.ts
│   │   │   │   └── yjs.model.ts
│   │   │   ├── schemas/
│   │   │   │   └── collab.ts
│   │   │   ├── utils/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── bandwidthBenchmark.test.ts
│   │   │   │   ├── accent.ts
│   │   │   │   ├── binaryEncoding.test.ts
│   │   │   │   ├── binaryEncoding.ts
│   │   │   │   ├── lww.test.ts
│   │   │   │   ├── lww.ts
│   │   │   │   ├── oplogUndo.test.ts
│   │   │   │   └── yjsPersistence.ts
│   │   │   ├── env.ts
│   │   │   ├── index.ts
│   │   │   ├── jwt.ts
│   │   │   ├── oplog.ts
│   │   │   └── sanitizer.ts
│   │   ├── tests/
│   │   │   └── sanitizer.test.ts
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── socket/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── README.md
│   │   │   │   ├── db.ts
│   │   │   │   ├── env.ts
│   │   │   │   └── redis.ts
│   │   │   ├── events/
│   │   │   │   ├── README.md
│   │   │   │   ├── batch.test.ts
│   │   │   │   └── board.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── rateLimiter.ts
│   │   │   ├── models/
│   │   │   │   └── chat.ts
│   │   │   ├── rooms/
│   │   │   │   └── README.md
│   │   │   ├── services/
│   │   │   │   ├── README.md
│   │   │   │   ├── oplogQueue.ts
│   │   │   │   └── presence.ts
│   │   │   ├── utils/
│   │   │   │   ├── README.md
│   │   │   │   ├── lamport.ts
│   │   │   │   └── recentOpsBuffer.ts
│   │   │   ├── clear-chats.ts
│   │   │   ├── index.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── README.md
│   │   │   ├── join.test.ts
│   │   │   ├── presence.test.ts
│   │   │   ├── redis-adapter.test.ts
│   │   │   └── socketRateLimit.test.ts
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── worker/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.ts
│   │   │   │   ├── env.ts
│   │   │   │   └── redis.ts
│   │   │   ├── compaction.ts
│   │   │   ├── index.ts
│   │   │   └── oplogWorker.ts
│   │   ├── tests/
│   │   │   ├── compaction.test.ts
│   │   │   └── oplog.test.ts
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── README.md
├── playwright-report/
│   ├── data/
│   │   ├── e0b332b26985098837660a14d495215410cbf1e8.zip
│   │   └── edc2fa5307a5531635a07aad2bd1afe6364fe51d.zip
│   ├── trace/
│   │   ├── assets/
│   │   │   ├── codeMirrorModule-rXmQmLUY.js
│   │   │   ├── defaultSettingsView-B-dXF5JN.js
│   │   │   └── urlMatch-L3liM589.js
│   │   ├── codeMirrorModule.-QdMvsKi.css
│   │   ├── codicon.DCmgc-ay.ttf
│   │   ├── defaultSettingsView.BLFoOugd.css
│   │   ├── index.B_TqY17P.css
│   │   ├── index.KZ4wOW1K.js
│   │   ├── index.html
│   │   ├── manifest.webmanifest
│   │   ├── playwright-logo.svg
│   │   ├── snapshot.B_Jk1wbt.js
│   │   ├── snapshot.html
│   │   ├── sw.bundle.js
│   │   ├── uiMode.C7UW1sC9.css
│   │   ├── uiMode.Dzuouizj.js
│   │   ├── uiMode.html
│   │   └── xtermModule.kHJ-D0s7.css
│   └── index.html
├── scripts/
│   ├── README.md
│   └── load-test-sockets.ts
├── test-results/
│   ├── example-get-started-link-chromium/
│   │   └── trace.zip
│   └── example-has-title-chromium/
│       └── trace.zip
├── tests/
│   ├── chaos/
│   │   ├── specs/
│   │   │   ├── mongodb-failover.test.ts
│   │   │   ├── redis-disconnect.test.ts
│   │   │   └── worker-crash.test.ts
│   │   └── utils/
│   │       └── docker-cli.ts
│   ├── e2e/
│   │   └── playwright/
│   │       ├── api/
│   │       │   ├── assets.api.ts
│   │       │   ├── auth.api.ts
│   │       │   ├── boards.api.ts
│   │       │   └── users.api.ts
│   │       ├── auth/
│   │       │   └── user.json
│   │       ├── fixtures/
│   │       │   ├── auth.fixture.ts
│   │       │   ├── board.fixture.ts
│   │       │   └── test.ts
│   │       ├── pages/
│   │       │   ├── BoardPage.ts
│   │       │   ├── Canvas.ts
│   │       │   ├── DashboardPage.ts
│   │       │   ├── LoginPage.ts
│   │       │   ├── Sidebar.ts
│   │       │   ├── SignupPage.ts
│   │       │   └── Toolbar.ts
│   │       ├── reports/
│   │       │   ├── html/
│   │       │   │   └── index.html
│   │       │   └── junit/
│   │       │       └── results.xml
│   │       ├── screenshots/
│   │       │   └── draw-stroke.png
│   │       ├── specs/
│   │       │   ├── accessibility/
│   │       │   │   ├── aria.spec.ts
│   │       │   │   ├── focus.spec.ts
│   │       │   │   └── keyboard.spec.ts
│   │       │   ├── assets/
│   │       │   │   ├── invalid-file.spec.ts
│   │       │   │   ├── large-upload.spec.ts
│   │       │   │   ├── render-image.spec.ts
│   │       │   │   └── upload-image.spec.ts
│   │       │   ├── auth/
│   │       │   │   ├── invalid-login.spec.ts
│   │       │   │   ├── login.spec.ts
│   │       │   │   ├── logout.spec.ts
│   │       │   │   ├── session.spec.ts
│   │       │   │   └── signup.spec.ts
│   │       │   ├── boards/
│   │       │   │   ├── create-board.spec.ts
│   │       │   │   ├── delete-board.spec.ts
│   │       │   │   ├── list-boards.spec.ts
│   │       │   │   ├── permissions.spec.ts
│   │       │   │   └── rename-board.spec.ts
│   │       │   ├── collaboration/
│   │       │   │   ├── cursors.spec.ts
│   │       │   │   ├── join-leave.spec.ts
│   │       │   │   ├── live-drawing.spec.ts
│   │       │   │   ├── reconnect.spec.ts
│   │       │   │   └── simultaneous-edit.spec.ts
│   │       │   ├── health/
│   │       │   │   ├── environment.spec.ts
│   │       │   │   └── health.spec.ts
│   │       │   ├── recovery/
│   │       │   │   ├── offline.spec.ts
│   │       │   │   ├── refresh.spec.ts
│   │       │   │   ├── restore.spec.ts
│   │       │   │   └── snapshot.spec.ts
│   │       │   ├── regression/
│   │       │   │   ├── collaboration-workflow.spec.ts
│   │       │   │   ├── happy-path.spec.ts
│   │       │   │   └── image-workflow.spec.ts
│   │       │   ├── visual/
│   │       │   │   ├── board.spec.ts-snapshots/
│   │       │   │   │   ├── board-page-chromium-win32.png
│   │       │   │   │   └── board-page-webkit-win32.png
│   │       │   │   ├── dashboard.spec.ts-snapshots/
│   │       │   │   │   ├── dashboard-page-chromium-win32.png
│   │       │   │   │   ├── dashboard-page-firefox-win32.png
│   │       │   │   │   └── dashboard-page-webkit-win32.png
│   │       │   │   ├── login.spec.ts-snapshots/
│   │       │   │   │   ├── login-page-chromium-win32.png
│   │       │   │   │   ├── login-page-firefox-win32.png
│   │       │   │   │   └── login-page-webkit-win32.png
│   │       │   │   ├── board.spec.ts
│   │       │   │   ├── dashboard.spec.ts
│   │       │   │   └── login.spec.ts
│   │       │   └── whiteboard/
│   │       │       ├── arrow.spec.ts
│   │       │       ├── draw.spec.ts
│   │       │       ├── move.spec.ts
│   │       │       ├── pan.spec.ts
│   │       │       ├── pen.spec.ts
│   │       │       ├── rectangle.spec.ts
│   │       │       ├── redo.spec.ts
│   │       │       ├── resize.spec.ts
│   │       │       ├── selection.spec.ts
│   │       │       ├── text.spec.ts
│   │       │       ├── undo.spec.ts
│   │       │       └── zoom.spec.ts
│   │       ├── test-data/
│   │       │   ├── boards/
│   │       │   │   ├── empty-board.json
│   │       │   │   └── populated-board.json
│   │       │   ├── images/
│   │       │   └── json/
│   │       │       └── users.json
│   │       ├── test-results/
│   │       ├── traces/
│   │       ├── utils/
│   │       │   ├── assertions.ts
│   │       │   ├── constants.ts
│   │       │   ├── random.ts
│   │       │   └── wait.ts
│   │       ├── videos/
│   │       ├── README.md
│   │       ├── global.setup.ts
│   │       ├── global.teardown.ts
│   │       ├── package.json
│   │       ├── playwright.config.ts
│   │       └── tsconfig.json
│   ├── performance/
│   │   ├── k6/
│   │   │   ├── api/
│   │   │   │   ├── append-operation.ts
│   │   │   │   ├── assets.ts
│   │   │   │   ├── auth-login.ts
│   │   │   │   ├── auth-signup.ts
│   │   │   │   ├── create-board.ts
│   │   │   │   ├── delete-board.ts
│   │   │   │   ├── get-board.ts
│   │   │   │   ├── list-boards.ts
│   │   │   │   ├── snapshots.ts
│   │   │   │   ├── upload-complete.ts
│   │   │   │   └── upload-init.ts
│   │   │   ├── config/
│   │   │   │   ├── environments.ts
│   │   │   │   ├── options.ts
│   │   │   │   └── thresholds.ts
│   │   │   ├── data/
│   │   │   │   └── payloads/
│   │   │   │       ├── assets.json
│   │   │   │       ├── boards.json
│   │   │   │       ├── operations.json
│   │   │   │       └── users.json
│   │   │   ├── metrics/
│   │   │   │   ├── business.ts
│   │   │   │   ├── latency.ts
│   │   │   │   └── websocket.ts
│   │   │   ├── reports/
│   │   │   │   ├── html/
│   │   │   │   └── summary/
│   │   │   ├── scenarios/
│   │   │   │   ├── breakpoint.ts
│   │   │   │   ├── load.ts
│   │   │   │   ├── smoke.ts
│   │   │   │   ├── soak.ts
│   │   │   │   ├── spike.ts
│   │   │   │   └── stress.ts
│   │   │   ├── scripts/
│   │   │   │   ├── cleanup.ts
│   │   │   │   ├── seed.ts
│   │   │   │   └── setup.ts
│   │   │   ├── types/
│   │   │   │   ├── asset.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── operation.ts
│   │   │   │   └── websocket.ts
│   │   │   ├── utils/
│   │   │   │   ├── assets.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── boards.ts
│   │   │   │   ├── checks.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── headers.ts
│   │   │   │   ├── helpers.ts
│   │   │   │   └── random.ts
│   │   │   ├── websocket/
│   │   │   │   ├── broadcast.ts
│   │   │   │   ├── connect.ts
│   │   │   │   ├── cursor.ts
│   │   │   │   ├── disconnect.ts
│   │   │   │   ├── draw.ts
│   │   │   │   ├── join-board.ts
│   │   │   │   ├── leave-board.ts
│   │   │   │   └── reconnect.ts
│   │   │   ├── workloads/
│   │   │   │   ├── load.ts
│   │   │   │   ├── smoke.ts
│   │   │   │   ├── soak.ts
│   │   │   │   ├── spike.ts
│   │   │   │   └── stress.ts
│   │   │   ├── README.md
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── PERFORMANCE_REPORT.md
│   │   └── STRUCTURE.md
│   └── README.md
├── tools/
│   └── README.md
├── Dockerfile
├── LICENSE
├── MAINTAINING.md
├── PROJECT_STRUCTURE.md
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
  - **`api/`**: Express + MongoDB API for auth, boards, snapshots, and oplog persistence.
  - **`client/`**: React/Vite client frontend whiteboard application.
  - **`infra-utils/`**: Database seeding and utility scripts.
  - **`shared/`**: Shared utilities, schemas, and configurations used by multiple packages.
  - **`socket/`**: Socket.IO collaborative real-time gateway server.
  - **`worker/`**: BullMQ background worker for oplog persistence deduplication and snapshot compaction.
- **`scripts/`**: Miscellaneous automation and utility scripts.
- **`tests/`**: Integration/system tests (chaos, load, e2e tests).
- **`tools/`**: Tooling scripts and helper configurations.
