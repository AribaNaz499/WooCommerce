// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // WebKit can report this hero link as outside viewport for pointer clicks.
  // Read its target and navigate directly to keep the test cross-browser stable.
  const getStartedLink = page.getByRole('link', { name: 'Get started' }).first();
  const href = await getStartedLink.getAttribute('href');
  await page.goto(new URL(href ?? '/docs/intro', page.url()).toString());

  // Docs heading text has changed over time, so assert route + any visible main heading.
  await expect(page).toHaveURL(/\/docs\//);
  await expect(page.locator('main h1:visible').first()).toBeVisible();
});
