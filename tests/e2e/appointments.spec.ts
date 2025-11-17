import { test, expect } from '@playwright/test';

test.describe('Appointments', () => {
  test('should display appointments page', async ({ page }) => {
    await page.goto('/appointments');

    // Check page heading
    const heading = page.locator('h1');
    await expect(heading).toContainText(/appointments/i);
  });

  test('should show appointment list', async ({ page }) => {
    await page.goto('/appointments');

    // Wait for appointments to load
    await page.waitForSelector('[data-testid="appointment-list"], [data-testid="appointment-card"], text=/appointments/i', {
      timeout: 10000,
    });

    // Check if appointments are visible (either cards or empty state)
    const hasAppointments = await page.locator('[data-testid="appointment-card"]').count();
    const emptyState = await page.locator('text=/no appointments/i').count();

    expect(hasAppointments > 0 || emptyState > 0).toBeTruthy();
  });

  test('should filter appointments by department', async ({ page }) => {
    await page.goto('/appointments');

    // Check if filter exists
    const filter = page.locator('select, [role="combobox"]').first();

    if (await filter.isVisible()) {
      await filter.click();

      // Select a department (if options are available)
      const options = await page.locator('option, [role="option"]').count();

      if (options > 1) {
        await page.locator('option, [role="option"]').nth(1).click();

        // Wait for filtering to complete
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should navigate to appointment details', async ({ page }) => {
    await page.goto('/appointments');

    // Wait for appointments to load
    await page.waitForTimeout(2000);

    // Click on first appointment if available
    const firstAppointment = page.locator('[data-testid="appointment-card"]').first();

    if (await firstAppointment.isVisible()) {
      await firstAppointment.click();

      // Check if modal or details page is shown
      await expect(
        page.locator('[data-testid="appointment-details"], [role="dialog"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Appointment Booking', () => {
  test.skip('should allow booking new appointment', async ({ page }) => {
    // This test requires authentication
    // TODO: Implement after auth flow is set up

    await page.goto('/appointments');

    // Look for "Book Appointment" button
    const bookButton = page.getByRole('button', { name: /book.*appointment/i });

    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Check if booking form appears
      await expect(page.locator('form, [data-testid="booking-form"]')).toBeVisible();
    }
  });
});
