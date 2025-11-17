import { test as base, Page } from '@playwright/test';

/**
 * Custom fixtures for E2E tests
 */

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  /**
   * Authenticated page fixture
   * Automatically logs in as admin before test
   */
  authenticatedPage: async ({ page }: { page: Page }, use) => {
    const username = process.env.TEST_ADMIN_USERNAME || 'admin';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    // Go to login page
    await page.goto('/admin/login');

    // Fill in credentials
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/admin\/dashboard/, { timeout: 10000 });

    // Use the authenticated page
    await use(page);

    // Logout after test
    // await page.click('text=/logout/i');
  },
});

export { expect } from '@playwright/test';
