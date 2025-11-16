# Testing Guide

This project includes comprehensive testing capabilities using Jest for unit tests and Playwright for end-to-end tests.

## Unit Tests (Jest)

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Unit tests are located in the `__tests__` directory, mirroring the project structure:

```
__tests__/
├── lib/
│   ├── roles.test.ts       # Role-based access control tests
│   └── audit.test.ts       # Audit logging system tests
```

### What's Tested

- **Role-based Access Control** (`lib/roles.test.ts`)
  - Permission checking for all roles
  - Role label translations
  - Permission hierarchy

- **Audit System** (`lib/audit.test.ts`)
  - Action and entity enums
  - Label translations
  - Audit log formatting

### Writing New Tests

Create new test files following the naming convention `*.test.ts` or `*.test.tsx`:

```typescript
import { yourFunction } from '@/lib/your-module';

describe('Your Module', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## End-to-End Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Test Structure

E2E tests are located in the `e2e` directory:

```
e2e/
├── homepage.spec.ts        # Homepage functionality tests
└── admin-auth.spec.ts      # Admin authentication tests
```

### What's Tested

- **Homepage** (`e2e/homepage.spec.ts`)
  - Page loading and title
  - Voice assistant presence
  - Navigation links
  - PWA meta tags

- **Admin Authentication** (`e2e/admin-auth.spec.ts`)
  - Login page elements
  - Invalid credentials handling
  - Protected route redirects
  - Patient registration flow

### Writing New E2E Tests

Create new test files following the naming convention `*.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    await page.goto('/your-page');

    // Your test assertions
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

## Test Reports

- **Jest Coverage**: Coverage reports are generated in `coverage/` directory
- **Playwright Reports**: HTML reports are generated in `playwright-report/` directory

View Playwright report:
```bash
npx playwright show-report
```

## Continuous Integration

Tests can be run in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

## Best Practices

1. **Unit Tests**
   - Test one thing per test
   - Use descriptive test names
   - Mock external dependencies
   - Aim for >80% coverage on critical paths

2. **E2E Tests**
   - Test user workflows, not implementation details
   - Use data-testid attributes for stable selectors
   - Clean up test data after tests
   - Run tests in isolation (no dependencies between tests)

3. **Test Data**
   - Use factories or fixtures for test data
   - Don't rely on production data
   - Reset database state between tests if needed
