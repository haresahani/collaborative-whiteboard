# Managed Database Services & Kubernetes Operators Architecture

This document details the configuration and deployment strategy for database infrastructure using managed cloud services (AWS ElastiCache, MongoDB Atlas, AWS DocumentDB) or Kubernetes Operators (Percona MongoDB Operator, Spotahome Redis Operator).

---

## 1. Managed Service Setup

### A. Managed MongoDB (MongoDB Atlas / AWS DocumentDB)

- **Deployment Tier**: M30+ (Production Cluster) with 3-node replica set across multiple Availability Zones.
- **Connection String**:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@prod-cluster.mongodb.net/whiteboard?retryWrites=true&w=majority&tls=true
  ```
- **Security**:
  - Enforce TLS 1.3 encryption in transit.
  - KMS-managed encryption at rest (AWS KMS / GCP Cloud KMS).
  - VPC Peering or PrivateLink connecting Kubernetes cluster worker nodes to MongoDB Atlas / AWS DocumentDB.

### B. Managed Redis (AWS ElastiCache for Redis / Redis Enterprise)

- **Deployment Tier**: Multi-AZ with Auto-Failover enabled, Redis Sentinel / Cluster Mode.
- **Configuration**:
  ```env
  REDIS_HOST=master.redis-prod.cache.amazonaws.com
  REDIS_PORT=6379
  REDIS_TLS=true
  ```
- **Security & Adapter**:
  - Auth token / password authentication mounted via K8s `Secret`.
  - Redis adapter (`@socket.io/redis-adapter`) configured for pub/sub node synchronization across Socket pod replicas.

---

## 2. Alternative: Kubernetes Operators

When deploying on self-managed Kubernetes or hybrid clouds without AWS/GCP managed services:

### A. Percona Distribution for MongoDB Operator

1. Install Percona CRDs:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.16.0/deploy/crd.yaml
   ```
2. Deploy Operator and custom resource (`psmdb-cluster.yaml`) specifying 3 replicas with persistent volumes (PVs).

### B. Redis Operator (Spotahome / Ot-container-kit)

1. Install Redis Operator:
   ```bash
   helm repo add ot-helm https://ot-container-kit.github.io/helm-charts/
   helm install redis-operator ot-helm/redis-operator --namespace whiteboard-production
   ```
2. Provision Sentinel / Redis Failover resource for high-availability caching.

---

## 3. Kubernetes Secret Management

- Use **ExternalSecrets Operator** or **AWS Secrets Manager** to sync secrets directly into Kubernetes `whiteboard-secrets` without hardcoding credentials in Git repository manifests.
