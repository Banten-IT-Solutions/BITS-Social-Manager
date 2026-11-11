import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('landing page for guests, login for protected routes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /One secure vault/ })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('register and login flow', async ({ page }) => {
    const email = `test${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    const email = `dash${Date.now()}@example.com`;
    await page.getByLabel('Name').fill('Dash User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('creates a project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /New project/ }).click();
    await page.getByLabel('Project name').fill('Banten IT Solutions');
    await page.getByLabel('Description').fill('Test project description');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByText('Banten IT Solutions')).toBeVisible({ timeout: 5000 });
  });
});
