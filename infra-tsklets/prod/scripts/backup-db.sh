#!/bin/bash
set -e

# Tsklets Database Backup Script
# Performs automated backup of PostgreSQL database

# Configuration
BACKUP_DIR="/opt/tsklets/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"
CONTAINER_NAME="tsklets-db"
DB_USER="postgres"
DB_NAME="tasklets"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log start
echo "$(date): ========================================" >> "$LOG_FILE"
echo "$(date): Starting backup" >> "$LOG_FILE"

# Check if container is running
if ! podman ps | grep -q "$CONTAINER_NAME"; then
  echo "$(date): ERROR - Container $CONTAINER_NAME is not running" >> "$LOG_FILE"
  exit 1
fi

# Perform backup
echo "$(date): Backing up database..." >> "$LOG_FILE"
if podman exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | \
   gzip > "$BACKUP_DIR/tasklets-$DATE.sql.gz"; then

  BACKUP_SIZE=$(du -h "$BACKUP_DIR/tasklets-$DATE.sql.gz" | cut -f1)
  echo "$(date): Backup completed successfully: tasklets-$DATE.sql.gz ($BACKUP_SIZE)" >> "$LOG_FILE"
else
  echo "$(date): ERROR - Backup FAILED" >> "$LOG_FILE"
  exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
echo "$(date): Cleaning up old backups..." >> "$LOG_FILE"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "tasklets-*.sql.gz" -mtime +$RETENTION_DAYS -type f | wc -l)
find "$BACKUP_DIR" -name "tasklets-*.sql.gz" -mtime +$RETENTION_DAYS -type f -delete

if [ "$DELETED_COUNT" -gt 0 ]; then
  echo "$(date): Deleted $DELETED_COUNT backup(s) older than $RETENTION_DAYS days" >> "$LOG_FILE"
else
  echo "$(date): No old backups to delete" >> "$LOG_FILE"
fi

# Show disk usage
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/tasklets-*.sql.gz 2>/dev/null | wc -l)
echo "$(date): Total backups: $BACKUP_COUNT, Total size: $TOTAL_SIZE" >> "$LOG_FILE"

# Log end
echo "$(date): Backup process completed successfully" >> "$LOG_FILE"
echo "$(date): ========================================" >> "$LOG_FILE"

exit 0
