# Testing GitHub Actions Locally with Act

## Overview

`act` allows you to run GitHub Actions workflows locally on your machine, without needing to push to GitHub every time.

## Prerequisites

- Docker Desktop installed and running
- `act` installed (we just installed it via Homebrew)

## Basic Usage

### List all workflows
```bash
act -l
```

### Dry run (see what would happen)
```bash
act -n
```

### Run a specific workflow
```bash
act -W .github/workflows/ci.yml
```

### Run a specific job
```bash
act -j test -W .github/workflows/ci.yml
```

### Run with a specific event
```bash
act push -W .github/workflows/ci.yml
```

## Common Options

- `-j, --job` - Run a specific job
- `-W, --workflows` - Specify the workflow file
- `-e, --eventpath` - Specify event JSON file
- `-s, --secret` - Pass secrets: `-s MY_SECRET=value`
- `-b, --bind` - Bind PATH for artifacts
- `--container-architecture` - Set the architecture (linux/amd64 or linux/arm64)
- `--reuse` - Reuse Docker containers (faster)
- `--rm` - Remove containers after run
- `-P` - Use specific platform: `-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest`

## For Our Worklog Project

### Test the lint step only
```bash
act -j test -s DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worklog_test" --container-architecture linux/amd64
```

### Test the build step
```bash
act -j build --container-architecture linux/amd64
```

### Run with Docker on ARM (M1/M2 Mac)
```bash
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
```

## Limitations

⚠️ **Important limitations of act:**

1. **Not all GitHub Actions are supported** - Some complex actions may not work
2. **Requires Docker** - All runs execute in Docker containers
3. **Secrets** - Need to pass manually with `-s` flag
4. **Services** - PostgreSQL service setup in workflows may not work perfectly
5. **File permissions** - Some Unix-specific features may behave differently

## Debugging Tips

1. **Keep the container running** to inspect it:
   ```bash
   act -j test --rm=false
   # Then: docker ps to see the container
   # Then: docker exec -it <container_id> /bin/bash
   ```

2. **Verbose output**:
   ```bash
   act -v
   ```

3. **Check logs**:
   ```bash
   docker logs <container_id>
   ```

## Alternative: Test Individual Scripts

For quick iterations, you can also test individual scripts locally:

```bash
# Test linting
pnpm run lint

# Test type checking
cd apps/web && pnpm run type-check

# Test building
pnpm run build:api
pnpm run build:web

# Run specific API
cd apps/api && pnpm run dev
```

## Summary

- **Use `act`** for testing workflows that involve Docker, services, or complex GitHub Actions
- **Use direct pnpm commands** for faster iteration on code changes
- **Push to GitHub** when you want to test the full CI/CD pipeline with all secrets and services

