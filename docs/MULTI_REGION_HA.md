# Multi-Region Architecture & High Availability (HA) Guide

This guide outlines the production multi-region architecture, disaster recovery strategies, S3 object lifecycle management, and failover capabilities for the Collaborative Whiteboard Platform.

---

## 🌍 Multi-Region Topology

```
                  ┌─────────────────────────────────┐
                  │   Cloudflare / Route53 GeoDNS   │
                  └────────────────┬────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ Primary Region (US)  │                  │ Standby Region (EU)  │
   │  GKE / EKS Cluster   │                  │  GKE / EKS Cluster   │
   │                      │                  │                      │
   │ [API] [Socket] [Client]                 │ [API] [Socket] [Client]
   └──────────┬───────────┘                  └──────────┬───────────┘
              │                                         │
              │ Cross-Region Sync                       │ Active Failover
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ Global MongoDB Atlas │ ◄──────────────► │ Global MongoDB Atlas │
   │    Primary Nodes     │   Replication    │   Secondary Nodes    │
   └──────────────────────┘                  └──────────────────────┘
              │                                         │
              ▼ S3 Snapshots                            ▼ S3 CRR
   ┌──────────────────────┐                  ┌──────────────────────┐
   │   S3 Primary Bucket  │ ───────────────► │    S3 Backup Bucket │
   │ (whiteboard-snapshots│   Cross-Region   │  (whiteboard-snapshots│
   │     us-east-1)       │   Replication    │      eu-west-1)      │
   └──────────────────────┘                  └──────────────────────┘
```

---

## 1. S3 Storage & Snapshot Architecture

### A. Bucket Configuration & Security

- **Primary Bucket**: `whiteboard-prod-snapshots-us-east-1`
- **Secondary Bucket**: `whiteboard-prod-snapshots-eu-west-1`
- **Bucket Features**:
  - **Bucket Versioning**: Enabled (protects against accidental deletion/overwrite)
  - **Server-Side Encryption**: Enforced with AWS KMS (`aws:kms`)
  - **Public Access Block**: All public access explicitly blocked.

### B. S3 Lifecycle Rules

- **Active Snapshots (`snapshots/`)**: Transition to `STANDARD_IA` (Infrequent Access) after **30 days**.
- **Archived Backups**: Transition to `GLACIER` after **90 days**.
- **Expiration Policy**: Delete non-current object versions after **365 days**.

---

## 2. Multi-Region Failover Strategy

### A. Traffic Routing (GeoDNS & Health Checks)

- Route53 / Cloudflare GeoDNS routes client requests to the closest active regional cluster.
- Health checks ping `/api/health` every 10 seconds.
- automatic failover redirects 100% of incoming traffic to the secondary cluster within **30 seconds** of primary region failure.

### B. Database Replication

- **MongoDB Atlas**: Multi-region cluster with elected primary node in region 1 and active read secondaries in region 2.
- **Redis Global Datastore**: Active-passive cross-region replication for state persistence.
- **S3 Cross-Region Replication (CRR)**: Asynchronous object replication from primary bucket to secondary disaster recovery bucket.
