# Local GitHub Actions Testing Guide

## Quick Start

`act` is now installed and configured! Here are practical commands for your workflow.

## Testing Individual Jobs

### 1. Security Audit (Fastest test)
```bash
act -j security -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64
```

### 2. Run the entire CI pipeline
```bash
act -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64
```

### 3. Test only the build step
```bash
act -j build -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64
```

### 4. Dry run (see what would happen without running)
```bash
act -n -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64
```

### 5. List all jobs
```bash
act -l
```

## Adding this as a script to package.json

Add this to your root `package.json`:

```json
"scripts": {
  "act:list": "act -l",
  "act:dry": "act -n -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64",
  "act:security": "act -j security -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64",
  "act:build": "act -j build -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64",
  "act:full": "act -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64"
}
```

Then run:
```bash
pnpm run act:security
pnpm run act:build
```

## Important Notes

⚠️ **act Limitations:**
- Requires Docker Desktop to be running
- Some complex GitHub Actions may not work perfectly
- Services (like PostgreSQL) in workflows may not work exactly as on GitHub
- Secrets need to be passed manually with `-s` flag

✅ **What Works Well:**
- Testing linting and build steps
- Catching syntax errors in workflows
- Quick iteration without pushing to GitHub
- Security audits and dependency checks

## Alternative: Test Manually

For the fastest feedback during development, you can also run the scripts directly:

```bash
# Test linting
pnpm run lint

# Test builds
pnpm run build:api
pnpm run build:web

# Check types
cd apps/web && pnpm run type-check

# Run the apps
pnpm run dev
```

## When to Use What?

- **`act`** - Test workflow logic, GitHub Actions configuration
- **Direct scripts** - Fast iteration during active development  
- **GitHub Actions** - Final validation before merging

## Troubleshooting

### act is asking for default image
The config file was created at: `~/Library/Application Support/act/actrc`

### Docker issues on Mac
If you see architecture warnings:
```bash
# Use the architecture flag
act --container-architecture linux/amd64
```

### Keep containers for debugging
```bash
act -j security --rm=false --container-architecture linux/amd64
# Then inspect: docker ps
# Then exec: docker exec -it <container_id> /bin/bash
```

## Summary

You have three options for testing:

1. **Local with act** - Test workflows locally (requires Docker)
2. **Local scripts** - Run pnpm commands directly (fastest for development)
3. **GitHub Actions** - Full integration testing on the build server

For your current project, I'd recommend:
- Use **pnpm commands** for day-to-day development
- Use **act** occasionally to test workflow changes
- Let **GitHub Actions** handle the final CI/CD pipeline

