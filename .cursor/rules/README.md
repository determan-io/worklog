# WorkLog Project Rules

This directory contains all development rules and guidelines for the WorkLog project. Rules are organized by category for easy navigation and maintenance.

## Rule Categories

### [Git Workflow](./git.md)
- Branch naming conventions
- Commit message format
- Pull request process
- GitHub CLI commands
- Code review guidelines
- Emergency procedures

### [Chrome MCP Validation](./chrome-mcp-validation.md)
- Browser validation requirements
- When to validate changes
- Validation process and commands
- Common issues and fixes
- Enforcement guidelines

### Coming Soon
- **Code Quality** - TypeScript, React, API development standards
- **Testing** - Test coverage, testing strategies, test organization
- **Documentation** - Documentation standards, update requirements
- **Security** - Authentication, authorization, data protection
- **Performance** - Frontend/backend optimization guidelines
- **Mobile** - React Native development rules
- **Deployment** - Environment management, release process
- **AI Assistant** - Guidelines for AI-assisted development

## Quick Reference

### Essential Commands
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

### Key Principles
- **Documentation First** - Update docs with every change
- **Test Coverage** - 80% minimum for new code
- **TypeScript Strict** - No `any` types allowed
- **Dual ID System** - SERIAL + UUID for all entities
- **Conventional Commits** - Use standard commit format
- **Mobile-First** - Consider mobile implications for all features

## How to Add New Rules

1. Create a new `.md` file in this directory
2. Follow the existing format and structure
3. Include practical examples and commands
4. Update this README to reference the new rules
5. Ensure rules are specific and actionable

## Rule Enforcement

- **Pre-commit hooks** - Automated checks for basic violations
- **CI/CD pipeline** - Automated testing and validation
- **Code reviews** - Human oversight for complex changes
- **Documentation checks** - Verify docs are updated with changes

## Questions or Suggestions?

If you have questions about existing rules or suggestions for new ones, please:
1. Create a GitHub issue with the `documentation` label
2. Discuss in team meetings
3. Propose changes via pull request

Remember: These rules exist to maintain code quality, consistency, and team productivity. They should evolve with the project and team needs.