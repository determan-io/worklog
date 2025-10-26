---
description: Chrome MCP validation rules for WorkLog
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: true
---

# Chrome MCP Validation Rules

## Overview
All changes to the WorkLog application MUST be validated using the Chrome MCP server to ensure they work as expected in a real browser environment.

## Core Principle
**Never assume code works without browser validation.** Always use the Chrome MCP server to test changes and verify functionality.

## Validation Requirements

### When to Validate
- **Always** after making frontend changes (UI, components, pages)
- **Always** after modifying authentication logic
- **Always** after changing API endpoints or authentication
- **Always** after database schema changes
- **Always** before marking a task as complete

### Validation Process
1. Start the Chrome MCP browser using `mcp_chrome-devtools_new_page` or `mcp_chrome-devtools_navigate_page`
2. Navigate to the changed feature
3. Test the functionality:
   - Use `mcp_chrome-devtools_take_snapshot` to see the current state
   - Use `mcp_chrome-devtools_click` to interact with elements
   - Use `mcp_chrome-devtools_fill` to test forms
   - Use `mcp_chrome-devtools_wait_for` to verify expected content loads
4. Verify the change works as expected
5. Check API calls are working correctly (network requests should not show 401 errors)
6. Verify no errors in console

### Common Validation Scenarios

#### UI Changes
```typescript
// Example: Validating a new button appears
await mcp_chrome-devtools_navigate_page({ url: 'http://localhost:3000/users' });
await mcp_chrome-devtools_take_snapshot();
// Verify the button exists and is clickable
```

#### Authentication Changes
```typescript
// Example: Validating login flow
await mcp_chrome-devtools_navigate_page({ url: 'http://localhost:3000/login' });
await mcp_chrome-devtools_click({ uid: 'login-button' });
// Verify redirect to Keycloak and successful callback
```

#### API Changes
```typescript
// Example: Validating API response
// Navigate to page that triggers API call
await mcp_chrome-devtools_navigate_page({ url: 'http://localhost:3000/users' });
// Check for data loading and no 401 errors in logs
```

## Browser Commands Reference
- `mcp_chrome-devtools_new_page` - Open new browser tab
- `mcp_chrome-devtools_navigate_page` - Navigate to URL
- `mcp_chrome-devtools_take_snapshot` - Get page state
- `mcp_chrome-devtools_click` - Click element
- `mcp_chrome-devtools_fill` - Fill form fields
- `mcp_chrome-devtools_wait_for` - Wait for content to appear
- `mcp_chrome-devtools_take_screenshot` - Capture screenshot
- `mcp_chrome-devtools_get_console_messages` - Check console for errors
- `mcp_chrome-devtools_get_network_requests` - Check API calls

## Red Flags (When Validation Fails)
- **401 Unauthorized errors**: Authentication not working
- **404 errors**: Route/page not found
- **Page not loading**: Server not running or blocking
- **Elements not appearing**: Code not deployed or JS errors
- **Forms not submitting**: Validation errors or missing endpoints

## Common Issues and Fixes

### "Button not appearing"
- Check code was saved and hot reloaded
- Verify component was imported and used
- Check for TypeScript errors

### "401 errors on API calls"
- Verify authentication token in localStorage
- Check auth middleware is correct
- Verify user exists in database

### "Login redirect loop"
- Check Keycloak callback URL is correct
- Verify token exchange endpoint
- Check auth state management

## Enforcement
- **AI assistants** must validate all changes using Chrome MCP
- **Developers** should re-validate after AI changes
- **No PR should be merged** without browser validation
- **Documentation** should include validation steps

## Example Workflow
```bash
# 1. Make code changes
# Edit src/components/Layout.tsx

# 2. Validate with Chrome MCP
const page = await mcp_chrome-devtools_navigate_page({ 
  url: 'http://localhost:3000' 
});
const snapshot = await mcp_chrome-devtools_take_snapshot();
// Verify new UI element exists

# 3. Test functionality
await mcp_chrome-devtools_click({ uid: 'new-button' });
// Verify expected behavior

# 4. Verify API calls
const requests = await mcp_chrome-devtools_get_network_requests();
// Check for successful calls, no 401s

# 5. Document results
// Mark task as complete only after successful validation
```

## Reminders
- Always start with a fresh page if testing after code changes
- Use `take_snapshot()` frequently to see current state
- Check network requests to verify API communication
- Look for console errors that might indicate problems
- Don't trust that code "should work" - always verify in browser

