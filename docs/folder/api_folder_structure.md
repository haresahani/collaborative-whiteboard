api/
├── src/
│ ├── config/ # Environment configs
│ │ ├── database.js
│ │ ├── redis.js
│ │ └── socket.js
│ ├── models/ # Mongoose schemas
│ │ ├── Room.js
│ │ ├── CanvasObject.js
│ │ └── User.js
│ ├── controllers/ # Business logic
│ │ ├── roomController.js
│ │ └── canvasController.js
│ ├── services/ # Core services (IMPORTANT!)
│ │ ├── ConflictResolver.js
│ │ ├── OperationalTransform.js
│ │ └── PresenceTracker.js
│ ├── middleware/
│ │ ├── auth.js
│ │ ├── rateLimiter.js
│ │ └── errorHandler.js
│ ├── sockets/ # Socket.io handlers
│ │ ├── canvasSocket.js
│ │ └── presenceSocket.js
│ ├── utils/
│ │ ├── logger.js
│ │ └── vectorClock.js
│ └── app.js # Express app
├── tests/
│ ├── unit/
│ └── integration/
└── package.json
