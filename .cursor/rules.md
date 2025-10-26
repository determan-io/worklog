---
description: Quick reference for WorkLog project rules
globs: ["**/*"]
alwaysApply: true
---

# WorkLog Project Rules

This document provides a quick reference to the WorkLog project rules. For complete details, see the [rules directory](./.cursor/rules/).

## Quick Reference

### Git Workflow
- **Branch naming**: `feature/description`, `fix/description`, `docs/description`
- **Pre-push**: Documentation updated, tests pass, code formatted
- **PR creation**: Use `gh pr create --title "type: description" --body "details"`
- **Commit format**: `type(scope): description`

### Code Quality
- **TypeScript strict mode** - No `any` types
- **Functional components only** - No class components
- **OpenAPI first** - Update specs before implementing
- **80% test coverage** minimum
- **Dual ID system** - SERIAL + UUID for all entities

### Documentation
- **Update docs** for any API, database, or feature changes
- **Markdown only** - Use `.md` files
- **Include examples** - Practical examples for all features
- **Test setup** - Always test setup from scratch

## Rule Categories

### [Git Workflow](./.cursor/rules/git.md)
Complete git workflow rules including branch management, commit conventions, PR process, and GitHub CLI commands.

### [Chrome MCP Validation](./.cursor/rules/chrome-mcp-validation.md)
Browser validation requirements for all changes. All UI, authentication, and API changes must be validated in a real browser using Chrome MCP tools.

### Coming Soon
- **Code Quality** - TypeScript, React, API development standards
- **Testing** - Test coverage, testing strategies, test organization
- **Documentation** - Documentation standards, update requirements
- **Security** - Authentication, authorization, data protection
- **Performance** - Frontend/backend optimization guidelines
- **Mobile** - React Native development rules
- **Deployment** - Environment management, release process
- **AI Assistant** - Guidelines for AI-assisted development

## Key Commands

```bash
# Create PR
gh pr create --title "feat: add time tracking" --body "Description"

# Run tests
npm test

# Format code
npm run format

# Generate API client
npm run client:generate
```

## Important Notes

- Always update documentation when making changes
- Follow the dual ID system (SERIAL + UUID) for all entities
- Use TypeScript strictly - no `any` types
- Write tests for new functionality
- Consider mobile implications for all features
- Maintain backward compatibility when possible