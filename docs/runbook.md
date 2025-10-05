# 📘 Runbook — Collaborative Whiteboard

This runbook is meant for operators, SREs, and contributors to understand **how to run, monitor, and recover** the system in development and production. Keeping a runbook shows maturity and real-world readiness.

---

## 🔧 Startup procedures

### Local development

```bash
# Install deps
pnpm install

# Start infra (Mongo + Redis)
docker compose -f infra/docker-compose.yml up -d

# Start API, Socket, Client
./dev-commands.sh dev
```

### Production (Docker Compose example)

```bash
# Build images
docker compose -f infra/docker-compose.yml build

# Start in detached mode
docker compose -f infra/docker-compose.yml up -d

# View logs
docker compose logs -f api
```

### Kubernetes (example)

```bash
kubectl apply -f infra/k8s/

# Verify pods
kubectl get pods -n whiteboard
```

---

## 📊 Monitoring

- **Metrics** (Prometheus/Grafana)
  - `events_total` (per board, per second)
  - `socket_connected_users`
  - `snapshot_duration_seconds`
  - `oplog_queue_size`

- **Logs**
  - Structured JSON logs with `boardId`, `userId`, `opId`
  - Centralized with ELK / Loki

- **Tracing**
  - OpenTelemetry enabled on API + Socket
  - Key spans: `board.join`, `op.apply`, `snapshot.write`

---

## ⚠️ Common issues & fixes

### MongoDB connection refused

- Check service:

```bash
docker compose logs mongo
```

- Validate `MONGO_URL` in `.env`

### Redis pub/sub not propagating

- Ensure Redis is running:

```bash
docker compose logs redis
```

- Check network policies if on k8s.

### API returns 401 Unauthorized

- Verify JWT secret consistency across API and Socket `.env`
- Ensure client sends correct `Authorization: Bearer <token>`

### Socket events not syncing across instances

- Verify Redis pub/sub config.
- Check that socket servers share the same `REDIS_URL`.

### High latency (>500ms p99)

- Inspect metrics: is Mongo slow? Are snapshots too frequent?
- Scale socket servers: `kubectl scale deployment socket --replicas=4`

---

## 🔄 Recovery procedures

### Restore from snapshot

```bash
# Identify latest snapshot
db.snapshots.find({ boardId: ObjectId("...") }).sort({ createdAt: -1 }).limit(1)

# Replay oplog after snapshot
node scripts/replay-oplog.js --board <boardId> --fromSnapshot <snapshotId>
```

### Drop and reseed DB (dev only)

```bash
docker compose exec mongo mongosh --eval 'db.getSiblingDB("whiteboard").dropDatabase()'
node scripts/seed.js
```

### Restart all services

```bash
docker compose down && docker compose up -d
```

---

## 🧪 Testing in production-like environments

- Run **load tests** with k6:

```bash
k6 run tests/load/socket-load.js
```

- Observe latency metrics in Grafana.
- Simulate failover by killing one socket pod: `kubectl delete pod socket-xyz`.
- Verify clients reconnect and state re-syncs from oplog.

---

## 🔐 Security checks

- Rotate JWT secrets periodically.
- Ensure TLS termination at ingress (Nginx/Envoy).
- Run `npm audit` weekly or via CI.
- Check rate limiting logs for anomalies.

---

## 🧭 Escalation path

1. Check runbook troubleshooting section.
2. If unresolved:
   - Collect logs, metrics, and reproduction steps.
   - Open GitHub issue with labels: `bug`, `infra`, `urgent`.
3. For critical incidents (data loss, downtime > 5m):
   - Notify maintainers in Slack/Discord `#incidents`.
   - Document post-mortem in `docs/incidents/YYYY-MM-DD.md`.

---

## ✅ Runbook checklist for operators

- [ ] Know how to start/stop infra (Docker & k8s).
- [ ] Understand how to read logs & metrics.
- [ ] Can restore a board from snapshot + oplog.
- [ ] Can reseed DB for dev/testing.
- [ ] Familiar with escalation path.

---

**Tip:** In interviews, reference this runbook to show you understand real-world ops, recovery, and monitoring — a big plus for FAANG/MANG interviews.
