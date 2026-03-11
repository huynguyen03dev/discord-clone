import { test, expect, Page } from "@playwright/test";
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
  await page.getByRole("button", { name: "Add a server" }).click();
  await page.getByPlaceholder("Enter server name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/servers\/[^/]+\/channels\/[^/]+/);
  const url = page.url();
  const match = url.match(/\/servers\/([^/]+)/);
  return match![1];
}

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
  await signIn(page);
});

test("create server", async ({ page }) => {
  await createTestServer(page, "Test Server");
  await expect(page.getByText("general")).toBeVisible();
  await expect(page.getByText("Test Server")).toBeVisible();
});

test("edit server", async ({ page }) => {
  await createTestServer(page, "Edit Me Server");
  await page.getByRole("button", { name: "Edit Me Server" }).click();
  await page.getByText("Server Settings").click();
  await page.getByPlaceholder("Enter server name").fill("Updated Name");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Updated Name")).toBeVisible();
});

test("delete server", async ({ page }) => {
  await createTestServer(page, "Delete Me Server");
  await page.getByRole("button", { name: "Delete Me Server" }).click();
  await page.getByText("Delete Server").click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});

test("invite flow", async ({ page, browser }) => {
  const serverId = await createTestServer(page, "Invite Server");
  await page.getByRole("button", { name: "Invite Server" }).click();
  await page.getByText("Invite People").click();
  const inviteInput = page.locator('input[readonly]');
  const inviteUrl = await inviteInput.inputValue();

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await setupClerkTestingToken({ page: page2 });
  await signInSecondUser(page2);
  await page2.goto(inviteUrl);
  await page2.waitForURL(/\/servers\//);
  await expect(page2.getByText("general")).toBeVisible();
  await context2.close();
});

test("channel management — text, audio, video", async ({ page }) => {
  await createTestServer(page, "Channel Server");

  await page.getByRole("button", { name: "Channel Server" }).click();
  await page.getByText("Create Channel").click();
  await page.getByPlaceholder("Enter channel name").fill("announcements");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("announcements")).toBeVisible();

  await page.getByRole("button", { name: "Channel Server" }).click();
  await page.getByText("Create Channel").click();
  await page.getByPlaceholder("Enter channel name").fill("voice-chat");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "audio" }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("voice-chat")).toBeVisible();

  await page.getByRole("button", { name: "Channel Server" }).click();
  await page.getByText("Create Channel").click();
  await page.getByPlaceholder("Enter channel name").fill("stream");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "video" }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("stream")).toBeVisible();
});

test("channel deletion — delete non-general, general has no delete", async ({ page }) => {
  await createTestServer(page, "Delete Channel Server");

  await page.getByRole("button", { name: "Delete Channel Server" }).click();
  await page.getByText("Create Channel").click();
  await page.getByPlaceholder("Enter channel name").fill("temp-channel");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("temp-channel")).toBeVisible();

  const tempChannel = page.getByText("temp-channel");
  await tempChannel.hover();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("temp-channel")).not.toBeVisible();

  const generalChannel = page.getByText("general").first();
  await generalChannel.hover();
  await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible();
});

test("member management — role change and kick", async ({ page, browser }) => {
  const serverId = await createTestServer(page, "Members Server");
  await page.getByRole("button", { name: "Members Server" }).click();
  await page.getByText("Invite People").click();
  const inviteInput = page.locator('input[readonly]');
  const inviteUrl = await inviteInput.inputValue();

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await setupClerkTestingToken({ page: page2 });
  await signInSecondUser(page2);
  await page2.goto(inviteUrl);
  await page2.waitForURL(/\/servers\//);
  await expect(page2.getByText("general")).toBeVisible();
  await context2.close();

  await page.goto(`http://localhost:3000/servers/${serverId}`);
  await page.waitForURL(/\/servers\//);

  await page.getByRole("button", { name: "Members Server" }).click();
  await page.getByText("Manage Members").click();

  const memberRow = page.locator('[class*="flex items-center gap-x-2 mb-6"]').filter({
    hasNot: page.locator('svg[class*="text-rose-500"]'),
  });
  await memberRow.locator('svg').last().click();

  await page.getByText("Role").click();
  await page.getByText("Moderator").click();
  await expect(page.locator('svg[class*="text-indigo-500"]')).toBeVisible();

  await memberRow.locator('svg').last().click();
  await page.getByText("Kick").click();
  await expect(memberRow).not.toBeVisible();
});
