import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/MedicalBrothers/);

    // Check that the main heading exists
    const heading = page.getByRole('heading', { name: /MedicalBrothers/i });
    await expect(heading).toBeVisible();
  });

  test('should have voice assistant functionality', async ({ page }) => {
    await page.goto('/');

    // Check for microphone button or voice interface
    const micButton = page.locator('button').filter({ hasText: /микрофон|говорить|слушать/i });
    await expect(micButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to patient login', async ({ page }) => {
    await page.goto('/');

    // Look for login link
    const loginLink = page.getByRole('link', { name: /вход|войти/i });
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/\/patient\/login|\/admin\/login/);
    }
  });

  test('should have proper PWA meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});
