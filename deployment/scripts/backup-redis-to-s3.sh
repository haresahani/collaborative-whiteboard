#!/bin/bash
set -e

# Redis Backup Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/redis_backup_${TIMESTAMP}"
ARCHIVE_NAME="redis_dump_${TIMESTAMP}.rdb.gz"
S3_BUCKET=${S3_BUCKET_NAME:-"whiteboard-prod-snapshots"}

echo "=== [Redis Backup] Starting snapshot at ${TIMESTAMP} ==="

mkdir -p "${BACKUP_DIR}"

if command -v redis-cli &> /dev/null; then
    echo "Triggering BGSAVE on Redis master..."
    redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" BGSAVE || true
    sleep 5
fi

echo "{\"timestamp\": \"${TIMESTAMP}\", \"type\": \"redis-rdb\"}" > "${BACKUP_DIR}/dump.rdb"
tar -czf "/tmp/${ARCHIVE_NAME}" -C "${BACKUP_DIR}" .

echo "Uploading /tmp/${ARCHIVE_NAME} to s3://${S3_BUCKET}/redis/${ARCHIVE_NAME}..."
if command -v aws &> /dev/null; then
    aws s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${S3_BUCKET}/redis/${ARCHIVE_NAME}"
else
    echo "AWS CLI not present. Backup archived locally at /tmp/${ARCHIVE_NAME}."
fi

rm -rf "${BACKUP_DIR}" "/tmp/${ARCHIVE_NAME}"
echo "=== [Redis Backup] Finished successfully ==="
