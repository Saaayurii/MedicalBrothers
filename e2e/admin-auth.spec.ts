import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/admin/login');

    // Check for login form elements
    await expect(page.getByLabel(/имя пользователя|username/i)).toBeVisible();
    await expect(page.getByLabel(/пароль|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /войти|login/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill in invalid credentials
    await page.getByLabel(/имя пользователя|username/i).fill('invalid_user');
    await page.getByLabel(/пароль|password/i).fill('invalid_password');

    // Submit the form
    await page.getByRole('button', { name: /войти|login/i }).click();

    // Check for error message
    await expect(page.getByText(/неверн|ошибка|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should have register link for patients', async ({ page }) => {
    await page.goto('/patient/login');

    // Check for registration link
    const registerLink = page.getByRole('link', { name: /регистрация|зарегистрироваться/i });
    await expect(registerLink).toBeVisible();

    // Click and verify navigation
    await registerLink.click();
    await expect(page).toHaveURL(/\/patient\/register/);
  });
});
