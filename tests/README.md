# E2E and Load Tests\n\nPlace Playwright E2E tests and k6 load tests in this folder.\n\n- e2e/\n- load/\n+\n\*\*\* End Patch```}"/>

# e2e and load tests (playwright / k6)

tests/
│
├── unit/
├── integration/
├── e2e/
│ └── playwright/
│ ├── fixtures/
│ ├── pages/
│ ├── specs/
│ │ ├── auth/
│ │ │ ├── login.spec.ts
│ │ │ └── signup.spec.ts
│ │ │
│ │ ├── boards/
│ │ │ ├── create-board.spec.ts
│ │ │ ├── delete-board.spec.ts
│ │ │ └── board-list.spec.ts
│ │ │
│ │ ├── collaboration/
│ │ │ ├── drawing-sync.spec.ts
│ │ │ ├── cursor-presence.spec.ts
│ │ │ ├── undo-redo.spec.ts
│ │ │ └── reconnect.spec.ts
│ │ │
│ │ └── assets/
│ │ ├── upload-image.spec.ts
│ │ └── image-render.spec.ts
│ │
│ ├── utils/
│ ├── playwright.config.ts
│ └── README.md
│
└── performance/
└── k6/
├── workloads/
├── scenarios/
├── lib/
└── README.md
