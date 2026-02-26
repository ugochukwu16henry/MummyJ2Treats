import { test, expect } from '@playwright/test';

const BASE_URL =
  process.env.E2E_BASE_URL ?? 'https://www.mummyj2treats.com';

// Founder admin login test – can be overridden via env
const FOUNDER_EMAIL =
  process.env.FOUNDER_EMAIL ?? 'ugochukwuhenry16@gmail.com';
const FOUNDER_PASSWORD =
  process.env.FOUNDER_PASSWORD ?? '1995Mobuchi@';

test.describe('Auth flows', () => {
  test('registers a new customer and reaches dashboard', async ({ page }) => {
    const uniqueEmail = `e2e+${Date.now()}@example.com`;

    await page.goto(`${BASE_URL}/auth/register`);

    await page.getByLabel('First name').fill('E2E');
    await page.getByLabel('Last name').fill('Tester');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Phone').fill('07000000000');
    await page.getByLabel('Password').fill('e2ePassword1!');
    await page.getByLabel('Confirm password').fill('e2ePassword1!');

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/dashboard(\/|$)/);
    await expect(
      page.getByRole('heading', { name: /dashboard/i }),
    ).toBeVisible();
  });

  test('shows error on invalid login credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    await page.getByLabel('Email').fill('nonexistent+e2e@example.com');
    await page.getByLabel('Password').fill('wrongPassword1!');

    await page.getByRole('button', { name: /login/i }).click();

    await expect(
      page.getByText(/invalid credentials|login failed/i),
    ).toBeVisible();
  });

  test('founder admin can log in and reach admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    await page.getByLabel('Email').fill(FOUNDER_EMAIL);
    await page.getByLabel('Password').fill(FOUNDER_PASSWORD);

    await Promise.all([
      page.waitForURL('**/dashboard/admin', { timeout: 20000 }),
      page.getByRole('button', { name: /login/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/dashboard\/admin(\/|$)/);
    await expect(
      page.getByRole('heading', { name: /founder admin dashboard/i }),
    ).toBeVisible();
  });
});

