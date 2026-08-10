# Production Backup & Restore Policy (Disaster Recovery Runbook)

This document establishes the official backup policy, RPO/RTO metrics, and step-by-step restoration procedures for the Collaborative Whiteboard platform.

---

## 🎯 Disaster Recovery Objectives

- **RPO (Recovery Point Objective)**: **1 Hour** (Maximum allowable data loss during catastrophic regional failure).
- **RTO (Recovery Time Objective)**: **15 Minutes** (Maximum allowable downtime during database restoration).

---

## ⏰ Backup Schedule & Lifecycle

| Data Store            | Backup Method                 | Schedule                              | Storage Location              | Retention                         |
| :-------------------- | :---------------------------- | :------------------------------------ | :---------------------------- | :-------------------------------- |
| **MongoDB Atlas**     | `mongodump` & Atlas Snapshots | Daily at 02:00 UTC (`0 2 * * *`)      | AWS S3 (`snapshots/mongodb/`) | 30 days active / 365 days Glacier |
| **Redis**             | `BGSAVE` (RDB Snapshot)       | Daily at 02:30 UTC (`30 2 * * *`)     | AWS S3 (`snapshots/redis/`)   | 14 days active                    |
| **Whiteboard Assets** | S3 Bucket Replication         | Continuous (Cross-Region Replication) | AWS S3 (Secondary Region)     | Indefinite (Versioning enabled)   |

---

## 🔄 Automated Backup Execution

Backups are executed automatically inside the Kubernetes cluster by the `whiteboard-db-backup-cronjob` CronJob located in `deployment/k8s/monitoring/backup-cronjob.yaml`.

To trigger an on-demand manual backup:

```bash
kubectl create job --from=cronjob/whiteboard-db-backup-cronjob manual-backup-job-$(date +%s) -n whiteboard-production
```

---

## 🛠️ Restoration Procedures

### 1. MongoDB Restoration

1. Identify the target snapshot filename from S3:
   ```bash
   aws s3 ls s3://whiteboard-prod-snapshots/mongodb/
   ```
2. Execute the restore script inside a maintenance pod:
   ```bash
   ./deployment/scripts/restore-from-s3.sh mongo mongo_backup_20260807_020000.tar.gz
   ```

### 2. Redis Cache Restoration

1. Stop socket connections by scaling socket deployment to 0:
   ```bash
   kubectl scale deployment whiteboard-socket --replicas=0 -n whiteboard-production
   ```
2. Run Redis snapshot restoration:
   ```bash
   ./deployment/scripts/restore-from-s3.sh redis redis_dump_20260807_023000.rdb.gz
   ```
3. Scale socket deployment back to normal:
   ```bash
   kubectl scale deployment whiteboard-socket --replicas=3 -n whiteboard-production
   ```
