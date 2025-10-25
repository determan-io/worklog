# WorkLog Infrastructure

This document describes the infrastructure setup for the WorkLog application.

## Services

### PostgreSQL Database
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: worklog
- **Username**: worklog
- **Password**: worklog123

### Keycloak Authentication
- **Image**: quay.io/keycloak/keycloak:24.0
- **Port**: 8080
- **Admin User**: admin
- **Admin Password**: admin123
- **Realm**: worklog

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Check service status**:
   ```bash
   docker-compose ps
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

## Access Points

- **Keycloak Admin Console**: http://localhost:8080/admin
- **Worklog Realm**: http://localhost:8080/realms/worklog
- **Realm Account Management**: http://localhost:8080/realms/worklog/account

## Test Users

The worklog realm comes pre-configured with test users:

- **Admin User**: admin / admin123
- **Regular User**: user / user123

## Configuration Files

- `docker-compose.yml` - Main Docker Compose configuration
- `keycloak-realm.json` - Keycloak realm configuration with users, clients, and roles

## Database Access

Connect to PostgreSQL directly:
```bash
docker-compose exec postgres psql -U worklog -d worklog
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up -d --build
```

### Keycloak realm not imported
```bash
# Import realm manually
docker exec worklog-keycloak /opt/keycloak/bin/kc.sh import --file /opt/keycloak/data/import/worklog-realm.json --override true
```

### Database connection issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U worklog -d worklog
```
