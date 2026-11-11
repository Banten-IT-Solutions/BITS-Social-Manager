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

test.describe('Content plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    const email = `content${Date.now()}@example.com`;
    await page.getByLabel('Name').fill('Content User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('content page prompts to connect Google Drive', async ({ page }) => {
    await page.goto('/content');
    await expect(page.getByRole('heading', { name: 'Content Plan' })).toBeVisible();
    await expect(page.getByText('Google Drive is not connected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New post' })).toBeVisible();
  });

  test('creates a scheduled post for a social account', async ({ page }) => {
    // Project + account are prerequisites.
    await page.goto('/projects');
    await page.getByRole('button', { name: /New project/ }).click();
    await page.getByLabel('Project name').fill('Content Project');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.getByRole('link', { name: 'Open project Content Project' }).click();
    await expect(page.getByRole('heading', { name: 'Content Project' })).toBeVisible();

    await page.getByRole('button', { name: 'Add account' }).click();
    await page.getByLabel('Account name').fill('TikTok Utama');
    await page.getByLabel('Email / Handle').fill('@tiktokutama');
    await page.getByLabel('Password').fill('secret123');
    await page.getByRole('dialog').getByRole('button', { name: 'Add account' }).click();
    await expect(page.getByText('TikTok Utama')).toBeVisible({ timeout: 5000 });

    // Create the post.
    await page.goto('/content');
    await page.getByRole('button', { name: 'New post' }).click();

    await page.getByLabel('Title').fill('Video peluncuran produk');
    await page.getByLabel('Schedule').fill('2026-12-01T10:00');
    await page.getByRole('dialog').getByRole('button', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Scheduled' }).click();
    await page.getByRole('button', { name: 'Create post' }).click();

    await expect(page.getByText('Video peluncuran produk').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Scheduled').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible();

    // The dashboard mirrors the same upcoming content card.
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Upcoming content' })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('button', { name: 'Open Video peluncuran produk' })).toBeVisible();
    await expect(page.getByText('Scheduled', { exact: true }).first()).toBeVisible();
  });
});
