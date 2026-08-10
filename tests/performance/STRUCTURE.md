performance/
│
├── k6/
│ │
│ ├── scenarios/
│ │ ├── auth/
│ │ │ ├── login.test.ts
│ │ │ └── signup.test.ts
│ │ │
│ │ ├── boards/
│ │ │ ├── create-board.test.ts
│ │ │ ├── list-boards.test.ts
│ │ │ ├── get-board.test.ts
│ │ │ └── delete-board.test.ts
│ │ │
│ │ ├── assets/
│ │ │ ├── upload.test.ts
│ │ │ └── resolve.test.ts
│ │ │
│ │ ├── snapshots/
│ │ │ ├── create.test.ts
│ │ │ └── restore.test.ts
│ │ │
│ │ └── health/
│ │ └── health.test.ts
│ │
│ ├── workloads/
│ │ ├── smoke.test.ts
│ │ ├── load.test.ts
│ │ ├── stress.test.ts
│ │ ├── spike.test.ts
│ │ ├── soak.test.ts
│ │ └── endurance.test.ts
│ │
│ ├── lib/
│ │ ├── auth.ts
│ │ ├── config.ts
│ │ ├── helpers.ts
│ │ ├── metrics.ts
│ │ └── random.ts
│ │
│ ├── fixtures/
│ │ ├── users.ts
│ │ └── boards.ts
│ │
│ ├── types/
│ │ └── api.ts
│ │
│ └── README.md
│
└── reports/
