import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'owner@demo.salespilot.ai';
const DEMO_PASSWORD = 'DemoPass123!';

async function login(page: Page) {
  await page.goto('/login');

  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Password').fill(DEMO_PASSWORD);

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/auth/login') &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: /sign in/i }).click();

  await loginResponse;
}

test.describe('Authentication', () => {
  test('logs in with demo credentials and reaches the dashboard', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });
  });

  test('rejects an invalid password', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Password').fill('wrong-password');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(
      page.getByText(/invalid email or password/i),
    ).toBeVisible();
  });
});