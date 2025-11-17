import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Medical Brothers/i);

    // Check main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for key navigation links
    await expect(page.getByRole('link', { name: /appointments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /assistant/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check if page is still functional on mobile
    await expect(page).toHaveTitle(/Medical Brothers/i);
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.goto('/');

    // Click on appointments link
    await page.click('text=/appointments/i');

    // Check if navigated to appointments page
    await expect(page).toHaveURL(/appointments/);
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check no critical errors (allow warnings)
    const criticalErrors = errors.filter(
      (error) => !error.includes('warning') && !error.includes('dev-only')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
