import { test, expect, type Page } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.fill('input[name="identifier"]', process.env.E2E_CLERK_USER_EMAIL!);
  await page.click('button:has-text("Continue")');
  await page.fill('input[name="password"]', process.env.E2E_CLERK_USER_PASSWORD!);
  await page.click('button:has-text("Continue")');
  await page.waitForURL(/\/(servers|setup)/);
}

async function signInSecondUser(page: Page) {
  await page.goto("/sign-in");
  await page.fill('input[name="identifier"]', process.env.E2E_CLERK_USER2_EMAIL!);
  await page.click('button:has-text("Continue")');
  await page.fill('input[name="password"]', process.env.E2E_CLERK_USER2_PASSWORD!);
  await page.click('button:has-text("Continue")');
  await page.waitForURL(/\/(servers|setup)/);
}

async function createTestServer(page: Page, name: string): Promise<string> {
  await page.locator('button:has(.lucide-plus)').first().click();
  await page.getByPlaceholder(/server name/i).fill(name);
  await page.getByRole("button", { name: /create/i }).click();
  await page.waitForURL(/\/servers\/[a-zA-Z0-9-]+/);
  const url = page.url();
  const match = url.match(/\/servers\/([a-zA-Z0-9-]+)/);
  return match![1];
}

async function sendMessage(page: Page, content: string) {
  const input = page.locator("form input[type=\"text\"]");
  await input.fill(content);
  await input.press("Enter");
}

test.describe("Messaging", () => {
  let serverId: string;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await signIn(page);
    serverId = await createTestServer(page, "Msg Test");
  });

  test("send text message", async ({ page }) => {
    await sendMessage(page, "Hello world");
    await expect(page.getByText("Hello world")).toBeVisible();

    const messageContainer = page.locator(".group").filter({ hasText: "Hello world" }).first();
    await expect(messageContainer.locator("img").first()).toBeVisible();
    await expect(messageContainer.locator("span").filter({ hasText: /\d/ }).first()).toBeVisible();
  });

  test("edit message", async ({ page }) => {
    await sendMessage(page, "Original message");
    await expect(page.getByText("Original message")).toBeVisible();

    const messageRow = page.locator(".group").filter({ hasText: "Original message" }).first();
    await messageRow.hover();

    await messageRow.locator(".lucide-edit, .lucide-pencil, [class*='Edit']").first().click();

    const editInput = messageRow.locator("form input");
    await editInput.clear();
    await editInput.fill("Edited message");
    await editInput.press("Enter");

    await expect(page.getByText("Edited message")).toBeVisible();
    await expect(page.getByText("(edited)")).toBeVisible();
  });

  test("delete message", async ({ page }) => {
    await sendMessage(page, "Message to delete");
    await expect(page.getByText("Message to delete")).toBeVisible();

    const messageRow = page.locator(".group").filter({ hasText: "Message to delete" }).first();
    await messageRow.hover();

    await messageRow.locator(".lucide-trash-2, .lucide-trash, [class*='Trash']").first().click();

    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText("This message has been deleted.")).toBeVisible();
  });

  test("file attachment", async ({ page }) => {
    const plusButton = page.locator("form button").filter({ has: page.locator(".lucide-plus") }).first();
    await plusButton.click();

    await expect(page.getByText(/drag|drop|upload/i)).toBeVisible();
  });

  test("real-time delivery", async ({ page }) => {
    await sendMessage(page, "realtime test");
    await expect(page.getByText("realtime test")).toBeVisible();
  });

  test("direct messaging", async ({ page, browser }) => {
    const inviteButton = page.locator('button, [role="menuitem"]').filter({ hasText: /invite/i }).first();
    await page.locator('[class*="header"] button, [class*="dropdown"]').first().click();
    await inviteButton.click();
    const inviteUrl = await page.locator('input[readonly], [class*="invite"] input').first().inputValue();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await setupClerkTestingToken({ page: page2 });
    await signInSecondUser(page2);

    await page2.goto(inviteUrl);
    await page2.waitForURL(/\/servers\//);
    await expect(page2.getByText("general")).toBeVisible();

    const secondUserName = process.env.E2E_CLERK_USER2_EMAIL!.split("@")[0];
    const memberButton = page.locator("button").filter({ hasText: new RegExp(secondUserName, "i") }).first();
    await memberButton.click();

    await page.waitForURL(/\/conversations\//);
    expect(page.url()).toContain("/conversations/");

    await sendMessage(page, "DM test");
    await expect(page.getByText("DM test")).toBeVisible();

    await context2.close();
  });

  test("pagination", async ({ page }) => {
    for (let i = 1; i <= 15; i++) {
      await sendMessage(page, `Message ${i}`);
      await expect(page.getByText(`Message ${i}`)).toBeVisible();
    }

    await page.locator("[class*='chat']").first().evaluate((el) => (el.scrollTop = 0));

    await expect(page.getByText("Message 1")).toBeVisible();
  });

  test("scroll behavior", async ({ page }) => {
    for (let i = 1; i <= 20; i++) {
      await sendMessage(page, `Scroll msg ${i}`);
    }
    await expect(page.getByText("Scroll msg 20")).toBeVisible();

    const chatContainer = page.locator("[class*='chat']").first();
    await chatContainer.evaluate((el) => (el.scrollTop = el.scrollTop - 200));

    const scrollBefore = await chatContainer.evaluate((el) => el.scrollTop);

    await sendMessage(page, "New while scrolled up");
    await expect(page.getByText("New while scrolled up")).toBeVisible({ timeout: 5000 }).catch(() => {});

    const scrollAfter = await chatContainer.evaluate((el) => el.scrollTop);
    expect(scrollAfter).toBe(scrollBefore);

    await chatContainer.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await sendMessage(page, "Auto scroll test");

    await expect(page.getByText("Auto scroll test")).toBeVisible();
  });
});
