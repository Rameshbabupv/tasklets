#!/bin/bash
set -e

# Tsklets Deployment Management Script
# Provides easy commands for managing production deployment

COMPOSE_FILE="infra-tsklets/prod/docker-compose.prod.yml"
PROJECT_ROOT="/opt/tsklets"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
show_help() {
  cat <<EOF
Tsklets Deployment Management

Usage: $0 <command>

Commands:
  start       Start all services
  stop        Stop all services
  restart     Restart all services
  status      Show container status
  logs        Show logs (follow mode)
  logs-app    Show application logs only
  logs-db     Show database logs only
  backup      Create database backup
  update      Pull latest code and restart app
  db-migrate  Run database migrations
  db-seed     Seed database with demo data
  health      Check application health
  shell-app   Open shell in app container
  shell-db    Open PostgreSQL shell
  help        Show this help message

Examples:
  $0 start
  $0 logs
  $0 backup
  $0 update

EOF
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Commands
cmd_start() {
  log_info "Starting all services..."
  podman-compose -f "$COMPOSE_FILE" up -d
  log_info "Services started. Run '$0 status' to check."
}

cmd_stop() {
  log_info "Stopping all services..."
  podman-compose -f "$COMPOSE_FILE" stop
  log_info "Services stopped."
}

cmd_restart() {
  log_info "Restarting all services..."
  podman-compose -f "$COMPOSE_FILE" restart
  log_info "Services restarted."
}

cmd_status() {
  log_info "Container status:"
  podman ps --filter "name=tsklets" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

cmd_logs() {
  log_info "Showing logs (Ctrl+C to exit)..."
  podman-compose -f "$COMPOSE_FILE" logs -f
}

cmd_logs_app() {
  log_info "Showing application logs (Ctrl+C to exit)..."
  podman logs -f tsklets-app
}

cmd_logs_db() {
  log_info "Showing database logs (Ctrl+C to exit)..."
  podman logs -f tsklets-db
}

cmd_backup() {
  log_info "Creating database backup..."
  "$PROJECT_ROOT/infra-tsklets/prod/scripts/backup-db.sh"
  log_info "Backup completed. Check /opt/tsklets/backups/"
}

cmd_update() {
  log_info "Updating application..."

  # Pull latest code
  log_info "Pulling latest code from git..."
  git pull origin main

  # Rebuild and restart app
  log_info "Rebuilding and restarting application..."
  podman-compose -f "$COMPOSE_FILE" up -d --build app

  log_info "Update completed."
  log_warn "Don't forget to run migrations if schema changed: $0 db-migrate"
}

cmd_db_migrate() {
  log_info "Running database migrations..."
  podman exec tsklets-app npm run db:push
  log_info "Migrations completed."
}

cmd_db_seed() {
  log_warn "This will seed the database with demo data."
  read -p "Are you sure? (yes/no): " confirm
  if [ "$confirm" = "yes" ]; then
    log_info "Seeding database..."
    podman exec tsklets-app npm run db:seed:demo
    log_info "Database seeded."
  else
    log_info "Cancelled."
  fi
}

cmd_health() {
  log_info "Checking application health..."

  # Check API
  if curl -s http://localhost:4030/health | grep -q "ok"; then
    log_info "✓ API health check passed"
  else
    log_error "✗ API health check failed"
  fi

  # Check Client Portal
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:4010 | grep -q "200"; then
    log_info "✓ Client Portal responding"
  else
    log_error "✗ Client Portal not responding"
  fi

  # Check Internal Portal
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:4020 | grep -q "200"; then
    log_info "✓ Internal Portal responding"
  else
    log_error "✗ Internal Portal not responding"
  fi

  # Check Database
  if podman exec tsklets-db pg_isready -U postgres &>/dev/null; then
    log_info "✓ Database is ready"
  else
    log_error "✗ Database is not ready"
  fi
}

cmd_shell_app() {
  log_info "Opening shell in app container..."
  podman exec -it tsklets-app /bin/sh
}

cmd_shell_db() {
  log_info "Opening PostgreSQL shell..."
  podman exec -it tsklets-db psql -U postgres -d tasklets
}

# Main
case "${1:-help}" in
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    cmd_restart
    ;;
  status)
    cmd_status
    ;;
  logs)
    cmd_logs
    ;;
  logs-app)
    cmd_logs_app
    ;;
  logs-db)
    cmd_logs_db
    ;;
  backup)
    cmd_backup
    ;;
  update)
    cmd_update
    ;;
  db-migrate)
    cmd_db_migrate
    ;;
  db-seed)
    cmd_db_seed
    ;;
  health)
    cmd_health
    ;;
  shell-app)
    cmd_shell_app
    ;;
  shell-db)
    cmd_shell_db
    ;;
  help|*)
    show_help
    ;;
esac
