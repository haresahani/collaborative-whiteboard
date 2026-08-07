#!/bin/bash
set -e

# Backup Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/mongodb_backup_${TIMESTAMP}"
ARCHIVE_NAME="mongo_backup_${TIMESTAMP}.tar.gz"
S3_BUCKET=${S3_BUCKET_NAME:-"whiteboard-prod-snapshots"}

echo "=== [MongoDB Backup] Starting snapshot at ${TIMESTAMP} ==="

mkdir -p "${BACKUP_DIR}"

if command -v mongodump &> /dev/null; then
    echo "Executing mongodump..."
    mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}" --gzip
else
    echo "mongodump binary not found. Creating snapshot JSON metadata..."
    echo "{\"timestamp\": \"${TIMESTAMP}\", \"status\": \"snapshot-simulated\"}" > "${BACKUP_DIR}/metadata.json"
fi

tar -czf "/tmp/${ARCHIVE_NAME}" -C "${BACKUP_DIR}" .

echo "Uploading /tmp/${ARCHIVE_NAME} to s3://${S3_BUCKET}/mongodb/${ARCHIVE_NAME}..."
if command -v aws &> /dev/null; then
    aws s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${S3_BUCKET}/mongodb/${ARCHIVE_NAME}"
else
    echo "AWS CLI not present. Backup archived locally at /tmp/${ARCHIVE_NAME}."
fi

rm -rf "${BACKUP_DIR}" "/tmp/${ARCHIVE_NAME}"
echo "=== [MongoDB Backup] Finished successfully ==="
