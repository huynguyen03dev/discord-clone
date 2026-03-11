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
  await page.locator('button').filter({ has: page.locator('svg') }).first().click();
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

    const messageContainer = page.getByText("Hello world").locator("..").locator("..");
    await expect(messageContainer.locator("img").first()).toBeVisible();
    await expect(messageContainer.getByText(/\d/).first()).toBeVisible();
  });

  test("edit message", async ({ page }) => {
    await sendMessage(page, "Original message");
    await expect(page.getByText("Original message")).toBeVisible();

    const messageRow = page.getByText("Original message").locator("..").locator("..");
    await messageRow.hover();

    await messageRow.getByRole("button").filter({ has: page.locator("svg") }).first().click();

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

    const messageRow = page.getByText("Message to delete").locator("..").locator("..");
    await messageRow.hover();

    await messageRow.getByRole("button").filter({ has: page.locator("svg") }).last().click();

    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText("This message has been deleted.")).toBeVisible();
  });

  // Full file upload E2E depends on UploadThing test mode configuration
  test.fixme("file attachment modal opens", async ({ page }) => {
    const plusButton = page.locator("form").getByRole("button").first();
    await plusButton.click();

    await expect(page.getByText(/drag|drop|upload/i)).toBeVisible();
  });

  // True cross-user real-time delivery requires E2E_CLERK_USER2_* credentials
  // and a second browser context. This test only verifies the sender's view.
  test("message appears after sending without page refresh", async ({ page }) => {
    await sendMessage(page, "realtime test");
    await expect(page.getByText("realtime test")).toBeVisible();
  });

  test("direct messaging", async ({ page, browser }) => {
    const inviteButton = page.getByRole("menuitem", { name: /invite/i }).or(page.getByRole("button", { name: /invite/i })).first();
    await page.getByRole("button").filter({ has: page.locator("svg") }).first().click();
    await inviteButton.click();
    const inviteUrl = await page.getByRole("textbox").or(page.locator("input[readonly]")).first().inputValue();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await setupClerkTestingToken({ page: page2 });
    await signInSecondUser(page2);

    await page2.goto(inviteUrl);
    await page2.waitForURL(/\/servers\//);
    await expect(page2.getByText("general")).toBeVisible();

    const secondUserName = process.env.E2E_CLERK_USER2_EMAIL!.split("@")[0];
    const memberButton = page.getByRole("button", { name: new RegExp(secondUserName, "i") }).first();
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

    const chatContainer = page.getByRole("log").or(page.locator("[data-testid='chat-messages']")).or(page.locator("main")).first();
    await chatContainer.evaluate((el) => (el.scrollTop = 0));

    await expect(page.getByText("Message 1")).toBeVisible();
  });

  test("scroll behavior", async ({ page }) => {
    for (let i = 1; i <= 20; i++) {
      await sendMessage(page, `Scroll msg ${i}`);
    }
    await expect(page.getByText("Scroll msg 20")).toBeVisible();

    const chatContainer = page.getByRole("log").or(page.locator("[data-testid='chat-messages']")).or(page.locator("main")).first();
    await chatContainer.evaluate((el) => (el.scrollTop = el.scrollTop - 200));

    const scrollBefore = await chatContainer.evaluate((el) => el.scrollTop);

    await sendMessage(page, "New while scrolled up");
    await expect(async () => {
      await expect(page.getByText("New while scrolled up")).toBeVisible();
    }).toPass({ timeout: 5000 });

    const scrollAfter = await chatContainer.evaluate((el) => el.scrollTop);
    expect(scrollAfter).toBe(scrollBefore);

    await chatContainer.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await sendMessage(page, "Auto scroll test");

    await expect(page.getByText("Auto scroll test")).toBeVisible();
  });
});
