import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
  test('should redirect to login page when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login');

    // Check for login form elements
    await expect(page.locator('input[name="username"], input[type="text"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for empty credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(1000);

    // Check for error (either HTML5 validation or custom error)
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const isInvalid = await usernameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill in invalid credentials
    await page.fill('input[name="username"], input[type="text"]', 'wronguser');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpass');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check for error message
    const errorMessage = page.locator('text=/invalid|incorrect|error/i');
    const hasError = await errorMessage.isVisible().catch(() => false);

    // Should either show error or stay on login page
    const isOnLoginPage = page.url().includes('/admin/login');

    expect(hasError || isOnLoginPage).toBeTruthy();
  });

  test.skip('should login with valid credentials', async ({ page }) => {
    // Skip by default - requires real credentials
    // To run: set TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD env vars

    const username = process.env.TEST_ADMIN_USERNAME;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!username || !password) {
      test.skip();
      return;
    }

    await page.goto('/admin/login');

    // Fill in credentials
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 10000 });
  });

  test('should have password field with type="password"', async ({ page }) => {
    await page.goto('/admin/login');

    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/login');

    // Check form is still visible and functional
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
