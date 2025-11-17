# Testing Documentation

This directory contains all tests for the Medical Brothers application.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests with Playwright
│   ├── home.spec.ts
│   ├── appointments.spec.ts
│   ├── ai-assistant.spec.ts
│   ├── admin-login.spec.ts
│   └── fixtures.ts         # Custom test fixtures
└── README.md
```

## E2E Tests (Playwright)

### Setup

Install Playwright browsers:

```bash
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests on mobile
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Debugging Tests

```bash
# Debug mode (opens inspector)
npm run test:e2e:debug

# Show test report
npx playwright show-report

# Generate trace
npx playwright test --trace on
```

### Writing Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');

    // Your test code
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

Using custom fixtures:

```typescript
import { test, expect } from './fixtures';

test('admin only test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/admin/dashboard');
  // You're already logged in!
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
   ```html
   <div data-testid="appointment-card">...</div>
   ```
   ```typescript
   await page.locator('[data-testid="appointment-card"]').click();
   ```

2. **Wait for elements properly**
   ```typescript
   await page.waitForSelector('[data-testid="results"]');
   await expect(element).toBeVisible();
   ```

3. **Use Page Object Model** for complex pages
   ```typescript
   class LoginPage {
     constructor(private page: Page) {}

     async login(username: string, password: string) {
       await this.page.fill('[name="username"]', username);
       await this.page.fill('[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

4. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Clean up code
   });
   ```

5. **Use fixtures for common setup**
   - See `fixtures.ts` for examples

### CI/CD Integration

Tests run automatically in CI/CD pipeline:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables

Set these for authenticated tests:

```bash
# .env.test
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=your_password
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### Test Reports

After running tests, view reports:

```bash
# HTML report
npx playwright show-report

# JSON report
cat test-results/results.json

# Screenshots (on failure)
ls test-results/
```

### Troubleshooting

**Tests timeout:**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running

**Element not found:**
- Use `page.pause()` to debug
- Check selectors with `page.locator('selector').highlight()`

**Flaky tests:**
- Add proper waits: `waitForLoadState('networkidle')`
- Use retry logic: set `retries: 2` in config
- Use `expect.poll()` for polling assertions

**Browser not found:**
```bash
npx playwright install
```

### Performance Testing

Measure page load times:

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('load');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### Accessibility Testing

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Coverage

Generate test coverage reports:

```bash
npm run test:coverage
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
