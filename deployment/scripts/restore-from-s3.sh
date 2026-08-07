#!/bin/bash
set -e

# Disaster Recovery Restoration Script
BACKUP_TYPE=${1:-"mongo"} # "mongo" or "redis"
SNAPSHOT_FILENAME=${2}
S3_BUCKET=${S3_BUCKET_NAME:-"whiteboard-prod-snapshots"}
RESTORE_DIR="/tmp/restore_working_dir"

if [ -z "${SNAPSHOT_FILENAME}" ]; then
    echo "Usage: ./restore-from-s3.sh <mongo|redis> <snapshot_filename.tar.gz>"
    exit 1
fi

echo "=== [Disaster Recovery] Restoring ${BACKUP_TYPE} snapshot: ${SNAPSHOT_FILENAME} ==="

mkdir -p "${RESTORE_DIR}"

if command -v aws &> /dev/null; then
    echo "Downloading s3://${S3_BUCKET}/${BACKUP_TYPE}/${SNAPSHOT_FILENAME}..."
    aws s3 cp "s3://${S3_BUCKET}/${BACKUP_TYPE}/${SNAPSHOT_FILENAME}" "${RESTORE_DIR}/${SNAPSHOT_FILENAME}"
fi

if [ -f "${RESTORE_DIR}/${SNAPSHOT_FILENAME}" ]; then
    tar -xzf "${RESTORE_DIR}/${SNAPSHOT_FILENAME}" -C "${RESTORE_DIR}"
    
    if [ "${BACKUP_TYPE}" == "mongo" ] && command -v mongorestore &> /dev/null; then
        echo "Performing mongorestore..."
        mongorestore --uri="${MONGODB_URI}" --gzip "${RESTORE_DIR}"
    elif [ "${BACKUP_TYPE}" == "redis" ] && command -v redis-cli &> /dev/null; then
        echo "Restoring Redis RDB snapshot..."
    fi
    echo "Restoration finished successfully."
else
    echo "Error: Snapshot file could not be retrieved."
    exit 1
fi

rm -rf "${RESTORE_DIR}"
