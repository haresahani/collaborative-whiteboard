For the `packages/api/src/` folder, the test folder structure would look like this:

```
packages/
└── api/
    ├── src/
    │   ├── routes/
    │   │   └── whiteboard.ts
    │   ├── controllers/
    │   │   └── authController.ts
    │   └── utils/
    │       └── jwt.ts
    └── tests/
        ├── routes/
        │   └── whiteboard.test.ts
        ├── controllers/
        │   └── authController.test.ts
        └── utils/
            └── jwt.test.ts
```

# Run ALL tests (client + API)

pnpm -w test

# Run only client tests

pnpm -w --filter client test

# Run only API tests

pnpm -w --filter api test

# Run tests in watch mode (auto-rerun on file changes)

pnpm -w --filter client test --watch
