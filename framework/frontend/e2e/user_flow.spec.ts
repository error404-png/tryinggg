import { test, expect } from '@playwright/test';

test('login and navigate to dashboard', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto('/login');

    // Fill login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Expect redirect to admin dashboard, not user dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Xenova AI')).toBeVisible();
});

test('create project flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);

    // Open Create Project Modal
    await page.click('[data-testid="create-project-btn"]');

    // Fill Project Details
    await expect(page.locator('text=Project Details')).toBeVisible();
    await page.fill('input[placeholder="e.g. Corporate Inventory System"]', 'Test E2E Project');
    await page.fill('textarea', 'A robust CRM system for managing testing');

    // Click Generate Blueprint
    await page.click('button:has-text("Generate Blueprint")');

    // Wait for Analysis (Thinking step)
    // It mocks immediately if error or waits 2s. The test should be patient.
    await expect(page.locator('text=Blueprint Generated'), { timeout: 10000 }).toBeVisible();

    // Click Create Project
    await page.click('button:has-text("Create Project")');

    // Verify Project Created (Sidebar should update)
    // We can check if "Test E2E Project" appears in the sidebar project list
    await expect(page.locator('text=Test E2E Project')).toBeVisible();
});
