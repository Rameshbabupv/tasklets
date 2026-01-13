# Database Backup and Restore Guide

Complete guide for backing up and restoring the Tsklets PostgreSQL database.

## Table of Contents

1. [Backup Strategies](#backup-strategies)
2. [Manual Backups](#manual-backups)
3. [Automated Backups](#automated-backups)
4. [Restore Procedures](#restore-procedures)
5. [Disaster Recovery](#disaster-recovery)

---

## Backup Strategies

### Types of Backups

1. **SQL Dump** - Logical backup (text format)
   - Pros: Human-readable, portable, selective restore
   - Cons: Slower for large databases
   - Use for: Regular backups, migration between versions

2. **Volume Backup** - Physical backup (binary format)
   - Pros: Fast, complete system state
   - Cons: Less portable, PostgreSQL version-specific
   - Use for: Disaster recovery, quick restore

3. **Both** - Recommended approach
   - Daily SQL dumps for point-in-time recovery
   - Weekly volume backups for disaster recovery

---

## Manual Backups

### SQL Dump Backup

#### Full Database Backup
```bash
# Create backup directory
mkdir -p /opt/tsklets/backups

# Backup entire database
podman exec tsklets-db pg_dump -U postgres tasklets > \
  /opt/tsklets/backups/tasklets-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup (recommended)
podman exec tsklets-db pg_dump -U postgres tasklets | \
  gzip > /opt/tsklets/backups/tasklets-$(date +%Y%m%d-%H%M%S).sql.gz
```

#### Schema-Only Backup
```bash
# Backup schema without data
podman exec tsklets-db pg_dump -U postgres --schema-only tasklets > \
  /opt/tsklets/backups/tasklets-schema-$(date +%Y%m%d).sql
```

#### Data-Only Backup
```bash
# Backup data without schema
podman exec tsklets-db pg_dump -U postgres --data-only tasklets > \
  /opt/tsklets/backups/tasklets-data-$(date +%Y%m%d).sql
```

#### Specific Table Backup
```bash
# Backup single table
podman exec tsklets-db pg_dump -U postgres -t users tasklets > \
  /opt/tsklets/backups/users-$(date +%Y%m%d).sql

# Backup multiple tables
podman exec tsklets-db pg_dump -U postgres -t users -t tickets tasklets > \
  /opt/tsklets/backups/users-tickets-$(date +%Y%m%d).sql
```

### Volume Backup

```bash
# Stop application (optional, for consistency)
podman stop tsklets-app

# Backup volume
podman volume export postgres_data -o \
  /opt/tsklets/backups/postgres_data-$(date +%Y%m%d).tar

# Start application
podman start tsklets-app

# Compressed volume backup
podman volume export postgres_data | \
  gzip > /opt/tsklets/backups/postgres_data-$(date +%Y%m%d).tar.gz
```

### Verify Backup

```bash
# Check backup file exists and has content
ls -lh /opt/tsklets/backups/

# For SQL dumps, check it's valid SQL
head -20 /opt/tsklets/backups/tasklets-20260112.sql

# For compressed backups
zcat /opt/tsklets/backups/tasklets-20260112.sql.gz | head -20
```

---

## Automated Backups

### Create Backup Script

```bash
# Create scripts directory
mkdir -p /opt/tsklets/infra-tsklets/prod/scripts

# Create backup script
cat > /opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh <<'EOF'
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/opt/tsklets/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log start
echo "$(date): Starting backup" >> "$LOG_FILE"

# Perform backup
podman exec tsklets-db pg_dump -U postgres tasklets | \
  gzip > "$BACKUP_DIR/tasklets-$DATE.sql.gz"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "$(date): Backup completed successfully: tasklets-$DATE.sql.gz" >> "$LOG_FILE"
else
  echo "$(date): Backup FAILED" >> "$LOG_FILE"
  exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
find "$BACKUP_DIR" -name "tasklets-*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "$(date): Cleaned up backups older than $RETENTION_DAYS days" >> "$LOG_FILE"

# Log end
echo "$(date): Backup process completed" >> "$LOG_FILE"
EOF

# Make script executable
chmod +x /opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh
```

### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh

# Or multiple backups per day
0 2,14 * * * /opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh
```

### Test Automated Backup

```bash
# Run script manually
/opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh

# Check backup was created
ls -lh /opt/tsklets/backups/

# Check log
tail -20 /opt/tsklets/backups/backup.log
```

---

## Restore Procedures

### Restore from SQL Dump

#### Full Database Restore

```bash
# CAUTION: This will DROP and recreate the database

# 1. Stop application
podman stop tsklets-app

# 2. Drop existing database (if exists)
podman exec tsklets-db psql -U postgres -c "DROP DATABASE IF EXISTS tasklets;"

# 3. Create fresh database
podman exec tsklets-db psql -U postgres -c "CREATE DATABASE tasklets;"

# 4. Restore from backup
cat /opt/tsklets/backups/tasklets-20260112.sql | \
  podman exec -i tsklets-db psql -U postgres -d tasklets

# Or from compressed backup
zcat /opt/tsklets/backups/tasklets-20260112.sql.gz | \
  podman exec -i tsklets-db psql -U postgres -d tasklets

# 5. Start application
podman start tsklets-app

# 6. Verify
curl http://localhost:4030/health
```

#### Restore Specific Table

```bash
# Restore single table (will replace existing data)
cat /opt/tsklets/backups/users-20260112.sql | \
  podman exec -i tsklets-db psql -U postgres -d tasklets
```

### Restore from Volume Backup

```bash
# 1. Stop all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml down

# 2. Remove old volume
podman volume rm postgres_data

# 3. Import backup
podman volume import postgres_data \
  /opt/tsklets/backups/postgres_data-20260112.tar

# Or from compressed
zcat /opt/tsklets/backups/postgres_data-20260112.tar.gz | \
  podman volume import postgres_data

# 4. Start all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# 5. Verify
podman exec tsklets-db psql -U postgres -d tasklets -c "SELECT COUNT(*) FROM users;"
```

### Test Restore (Safe Method)

```bash
# Create test database to verify backup
podman exec tsklets-db psql -U postgres -c "CREATE DATABASE tasklets_test;"

# Restore to test database
cat /opt/tsklets/backups/tasklets-20260112.sql | \
  podman exec -i tsklets-db psql -U postgres -d tasklets_test

# Verify data
podman exec tsklets-db psql -U postgres -d tasklets_test -c "\dt"
podman exec tsklets-db psql -U postgres -d tasklets_test -c "SELECT COUNT(*) FROM users;"

# Clean up
podman exec tsklets-db psql -U postgres -c "DROP DATABASE tasklets_test;"
```

---

## Disaster Recovery

### Scenario 1: Database Corruption

```bash
# 1. Stop application
podman stop tsklets-app

# 2. Attempt to diagnose
podman logs tsklets-db

# 3. If unfixable, restore from latest backup
# Follow "Restore from SQL Dump" procedure above
```

### Scenario 2: Container Deleted

```bash
# 1. Verify volume still exists
podman volume ls | grep postgres_data

# 2. If volume exists, just restart services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# 3. If volume missing, restore from volume backup
# Follow "Restore from Volume Backup" procedure above
```

### Scenario 3: Complete Server Failure

```bash
# On new server:

# 1. Install prerequisites
sudo dnf install podman podman-compose

# 2. Clone repository
git clone <repo-url> /opt/tsklets
cd /opt/tsklets

# 3. Restore .env file (from secure backup location)
cp /secure/backup/.env .

# 4. Start services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# 5. Wait for services to be ready
sleep 30

# 6. Restore database from backup
cat /backup/location/tasklets-latest.sql.gz | \
  gunzip | \
  podman exec -i tsklets-db psql -U postgres -d tasklets

# 7. Verify
curl http://localhost:4030/health
```

### Scenario 4: Accidental Data Deletion

```bash
# Restore specific table from backup
# This preserves other tables

# 1. Find appropriate backup
ls -lh /opt/tsklets/backups/

# 2. Extract and restore specific table
podman exec tsklets-db pg_dump -U postgres -t users tasklets > \
  /tmp/current-users.sql.backup

# 3. Restore from backup
cat /opt/tsklets/backups/tasklets-20260112.sql | \
  grep -A 10000 "-- Data for Name: users" | \
  podman exec -i tsklets-db psql -U postgres -d tasklets
```

---

## Best Practices

### 1. Regular Testing

```bash
# Test restore monthly
# Create test environment
# Restore backup
# Verify application works
```

### 2. Multiple Backup Locations

```bash
# Local backups
/opt/tsklets/backups/

# Remote backups (rsync, scp, cloud storage)
rsync -avz /opt/tsklets/backups/ backup-server:/backups/tsklets/

# Cloud backup (example with S3)
aws s3 sync /opt/tsklets/backups/ s3://my-bucket/tsklets-backups/
```

### 3. Retention Policy

- **Daily backups**: Keep 7 days
- **Weekly backups**: Keep 4 weeks
- **Monthly backups**: Keep 12 months

```bash
# Implement in backup script
find "$BACKUP_DIR" -name "daily-*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "weekly-*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "monthly-*.sql.gz" -mtime +365 -delete
```

### 4. Monitor Backup Success

```bash
# Check backup log daily
tail -50 /opt/tsklets/backups/backup.log

# Set up alerts for backup failures
# (email, Slack, monitoring system)
```

### 5. Document Recovery Procedures

- Keep this guide accessible
- Test procedures regularly
- Update documentation when changes are made
- Train team members on restore procedures

---

## Quick Reference

### Backup Commands
```bash
# SQL dump
podman exec tsklets-db pg_dump -U postgres tasklets | gzip > backup.sql.gz

# Volume
podman volume export postgres_data | gzip > backup.tar.gz
```

### Restore Commands
```bash
# SQL dump
zcat backup.sql.gz | podman exec -i tsklets-db psql -U postgres -d tasklets

# Volume (requires services down)
podman-compose down
podman volume rm postgres_data
zcat backup.tar.gz | podman volume import postgres_data
podman-compose up -d
```

### Verify Commands
```bash
# Check data
podman exec tsklets-db psql -U postgres -d tasklets -c "SELECT COUNT(*) FROM users;"

# Check health
curl http://localhost:4030/health
```
