# Git Workflow & Branch Management Rules

## Branch Naming Convention
- **Feature branches**: `feature/description` (e.g., `feature/user-authentication`, `feature/time-tracking`)
- **Bug fixes**: `fix/description` (e.g., `fix/login-validation`, `fix/mobile-offline-sync`)
- **Documentation**: `docs/description` (e.g., `docs/api-update`, `docs/deployment-guide`)
- **Refactoring**: `refactor/description` (e.g., `refactor/database-schema`, `refactor/api-structure`)
- **Hotfixes**: `hotfix/description` (e.g., `hotfix/security-patch`)

## Pre-Push Checklist
Before pushing any branch, ensure:
1. **Documentation is updated** - All relevant docs in `/docs` are current
2. **All tests pass** - Run `npm test` in each affected package
3. **Code is formatted** - Run `npm run format` and `npm run lint`
4. **No console.log statements** - Remove all debugging logs
5. **Commit messages are clear** - Use conventional commit format
6. **Branch is up to date** - Rebase on latest main branch

## Commit Message Format
Use conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

### Examples:
- `feat(auth): add Keycloak integration`
- `fix(api): resolve time entry validation error`
- `docs(api): update OpenAPI specification`
- `refactor(database): optimize time entries query`
- `test(mobile): add offline sync tests`

### Commit Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

## Pull Request Process

### 1. Create PR using GitHub CLI
```bash
gh pr create --title "feat: add time tracking validation" --body "Implements client-side validation for time entries with proper error handling and user feedback."
```

### 2. PR Title Format
Use conventional commit format: `type: description`

### 3. PR Description Must Include
- **What was changed** - Clear description of changes
- **Why it was changed** - Business justification
- **How to test** - Step-by-step testing instructions
- **Breaking changes** - Any breaking changes and migration steps
- **Screenshots** - For UI changes, include before/after screenshots
- **Related issues** - Link to any related GitHub issues

### 4. Required Checks
- [ ] All CI tests pass
- [ ] Code review approval (at least 1 reviewer)
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Branch is up to date with main

## GitHub CLI Commands

### Pull Request Management
```bash
# Create PR
gh pr create --title "title" --body "description" --assignee @me

# List PRs
gh pr list --state open
gh pr list --author @me
gh pr list --label "bug"

# View PR details
gh pr view [number]
gh pr view [number] --web

# Merge PR
gh pr merge [number] --squash
gh pr merge [number] --merge
gh pr merge [number] --rebase

# Close PR
gh pr close [number]
```

### Issue Management
```bash
# Create issue
gh issue create --title "title" --body "description" --label "bug"

# List issues
gh issue list --state open
gh issue list --assignee @me
gh issue list --label "enhancement"

# View issue
gh issue view [number]

# Close issue
gh issue close [number]
```

### Repository Management
```bash
# View repository info
gh repo view

# Clone repository
gh repo clone [owner/repo]

# Create repository
gh repo create [name] --public/--private

# Fork repository
gh repo fork [owner/repo]
```

## Branch Protection Rules

### Main Branch Protection
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict pushes to main branch
- Require linear history (no merge commits)

### Required Status Checks
- All tests must pass
- Code coverage must meet threshold
- Linting must pass
- Security scans must pass
- Documentation must be updated

## Merge Strategies

### Feature Branches
- Use **squash and merge** for clean history
- Single commit per feature
- Clear commit message describing the feature

### Hotfix Branches
- Use **merge commit** to preserve context
- Keep hotfix commits separate
- Include hotfix reference in commit message

### Release Branches
- Use **rebase and merge** for linear history
- Clean up commits before merging
- Tag releases appropriately

## Git Hooks

### Pre-commit Hook
```bash
#!/bin/sh
# Run linting and formatting
npm run lint
npm run format

# Run type checking
npm run type-check

# Run tests for changed files
npm run test:changed
```

### Pre-push Hook
```bash
#!/bin/sh
# Run full test suite
npm test

# Check for console.log statements
if grep -r "console\.log" src/; then
  echo "Error: console.log statements found. Remove before pushing."
  exit 1
fi

# Ensure documentation is updated
if git diff --name-only HEAD~1 | grep -E "\.(ts|tsx|js|jsx)$" | xargs grep -l "TODO\|FIXME"; then
  echo "Warning: TODO/FIXME comments found in code changes."
fi
```

## Emergency Procedures

### Hotfix Process
1. **Create hotfix branch** from main: `git checkout -b hotfix/critical-issue`
2. **Fix the issue** with minimal changes
3. **Test thoroughly** in staging environment
4. **Deploy immediately** to production
5. **Create follow-up PR** for proper review and documentation
6. **Update documentation** if needed

### Rollback Process
1. **Identify the issue** and assess impact
2. **Revert to last known good state**: `git revert [commit-hash]`
3. **Deploy rollback** immediately
4. **Investigate root cause** thoroughly
5. **Create proper fix** and test extensively
6. **Deploy fix** when ready with full review process

## Code Review Guidelines

### For Authors
- **Self-review first** - Review your own code before requesting review
- **Small, focused PRs** - Keep changes small and focused on single purpose
- **Clear descriptions** - Explain what, why, and how
- **Test your changes** - Ensure all tests pass locally
- **Update documentation** - Keep docs current with code changes

### For Reviewers
- **Review within 24 hours** - Respond promptly to review requests
- **Be constructive** - Provide helpful feedback and suggestions
- **Test the changes** - Actually test the functionality
- **Check security** - Look for security vulnerabilities
- **Verify tests** - Ensure adequate test coverage

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is proper
- [ ] Code is readable and maintainable
- [ ] No breaking changes without proper migration

## Best Practices

### Branch Management
- **Delete merged branches** - Clean up after merging
- **Keep branches short-lived** - Merge within a few days
- **Regular rebasing** - Keep branches up to date with main
- **Meaningful names** - Use descriptive branch names

### Commit Management
- **Atomic commits** - Each commit should be a complete, working change
- **Frequent commits** - Commit often with small, logical changes
- **Good commit messages** - Clear, descriptive commit messages
- **Squash before merging** - Clean up commit history

### Collaboration
- **Communication** - Discuss major changes before implementing
- **Respect review feedback** - Address all review comments
- **Help others** - Be available for questions and pair programming
- **Share knowledge** - Document complex solutions and patterns