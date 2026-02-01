#!/usr/bin/env bash

# Backup Script for PostgreSQL Database
# Usage: ./backup.sh

set -e

BACKUP_DIR="postgres-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.sql"

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."

# Create backup
if command -v docker &> /dev/null; then
    # Docker environment
    docker exec cms_db pg_dump -U ${POSTGRES_USER:-admin} ${POSTGRES_DB:-cms_ai_db} > $BACKUP_FILE
else
    # Local PostgreSQL
    pg_dump -U ${POSTGRES_USER:-admin} ${POSTGRES_DB:-cms_ai_db} > $BACKUP_FILE
fi

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: $BACKUP_FILE.gz"

# Keep only last 10 backups
cd $BACKUP_DIR
ls -t backup-*.sql.gz | tail -n +11 | xargs -r rm
echo "🧹 Old backups cleaned up"

echo "🎉 Backup complete!"
