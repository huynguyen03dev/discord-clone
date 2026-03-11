import { test, expect, Page } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.fill('input[name="identifier"]', process.env.E2E_CLERK_USER_EMAIL!);
  await page.click('button:has-text("Continue")');
  await page.fill('input[name="password"]', process.env.E2E_CLERK_USER_PASSWORD!);
  await page.click('button:has-text("Continue")');
  await page.waitForURL(/\/(servers|setup)/);
}

test("unauthenticated user is redirected to sign-in", async ({ page }) => {
  await page.goto("/servers/any-id");
  await expect(page).toHaveURL(/sign-in/);
});

test("authenticated user can access protected routes", async ({ page }) => {
  await signIn(page);
  await page.goto("/servers/any-id");
  await expect(page.locator("nav")).toBeVisible();
});

test("sign-in flow redirects to servers or setup", async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/servers|setup/);
});
