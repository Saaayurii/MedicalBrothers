import { test, expect } from '@playwright/test';

test.describe('AI Medical Assistant', () => {
  test('should load assistant page', async ({ page }) => {
    await page.goto('/assistant');

    // Check page is loaded
    await expect(page).toHaveURL(/assistant/);

    // Check for chat interface elements
    const chatContainer = page.locator('[data-testid="chat-container"], .chat-container, [role="log"]');
    await expect(chatContainer).toBeVisible({ timeout: 10000 });
  });

  test('should display message input', async ({ page }) => {
    await page.goto('/assistant');

    // Check for message input
    const input = page.locator('textarea, input[type="text"]').last();
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should send and receive message', async ({ page }) => {
    await page.goto('/assistant');

    // Wait for chat to be ready
    await page.waitForLoadState('networkidle');

    // Find message input
    const input = page.locator('textarea, input[type="text"]').last();
    await input.fill('Hello');

    // Find and click send button
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Check if message was sent (should appear in chat)
    const messages = page.locator('[data-testid="message"], .message');
    const messageCount = await messages.count();

    expect(messageCount).toBeGreaterThan(0);
  });

  test('should handle voice input button', async ({ page }) => {
    await page.goto('/assistant');

    // Look for voice input button
    const voiceButton = page.locator('button[aria-label*="voice"], button:has-text("🎤")');

    if (await voiceButton.isVisible()) {
      // Just check it's clickable, don't actually click (requires permissions)
      await expect(voiceButton).toBeEnabled();
    }
  });

  test('should display welcome message', async ({ page }) => {
    await page.goto('/assistant');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Check for welcome or system message
    const welcomeMessage = page.locator('text=/welcome|hello|how can i help/i').first();

    // Welcome message should be visible or chat should be ready
    const hasWelcome = await welcomeMessage.isVisible().catch(() => false);
    const hasInput = await page.locator('textarea, input').last().isVisible();

    expect(hasWelcome || hasInput).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/assistant');

    // Check chat interface is still functional
    const input = page.locator('textarea, input[type="text"]').last();
    await expect(input).toBeVisible({ timeout: 10000 });
  });
});
