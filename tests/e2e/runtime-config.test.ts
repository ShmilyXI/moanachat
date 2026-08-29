import { expect, test } from "@playwright/test";
import { generateRandomTestUser } from "../helpers";

test.describe("Runtime provider configuration", () => {
  test("saves and clears a New API connection without returning the key", async ({
    page,
  }) => {
    let savedBody: Record<string, string> | undefined;
    let configured = false;

    await page.route("**/api/runtime-config", async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON() as Record<string, string>;
        savedBody = body;
        configured = true;
        await route.fulfill({
          body: JSON.stringify({
            baseUrl: body.baseUrl,
            configured: true,
            mode: "embedded",
          }),
          contentType: "application/json",
          status: 200,
        });
        return;
      }

      if (route.request().method() === "DELETE") {
        configured = false;
        await route.fulfill({
          body: JSON.stringify({ success: true }),
          contentType: "application/json",
          status: 200,
        });
        return;
      }

      await route.fulfill({
        body: JSON.stringify(
          configured
            ? {
                baseUrl: "https://newapi.example.com",
                configured: true,
                mode: "embedded",
              }
            : { configured: false, mode: "gateway" }
        ),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          capabilities: {
            "openai/gpt-4.1": { reasoning: false, tools: true, vision: false },
          },
          defaultModelId: "openai/gpt-4.1",
          mode: "embedded",
          models: [
            {
              description: "",
              id: "openai/gpt-4.1",
              name: "GPT 4.1",
              provider: "openai",
            },
          ],
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/", { timeout: 10_000 });
    await page.getByRole("link", { name: "API" }).click({ timeout: 10_000 });

    await expect(page.getByLabel("New API base URL")).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByLabel("New API base URL")
      .fill("https://newapi.example.com");
    await page.getByLabel("New API key").fill("sk-account-secret");
    await page.getByRole("button", { name: "Save connection" }).click();

    await expect(page.getByText("1 models available")).toBeVisible();
    await expect(page.getByText("https://newapi.example.com")).toBeVisible();
    expect(savedBody).toEqual({
      apiKey: "sk-account-secret",
      baseUrl: "https://newapi.example.com",
    });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("sk-account-secret");

    await page.getByRole("button", { name: "Clear connection" }).click();
    await expect(page.getByText("No connection configured")).toBeVisible();
  });

  test("persists the connection per signed-in account", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const userA = {
      ...generateRandomTestUser(),
      email: `runtime-a-${Date.now()}@playwright.com`,
    };
    const userB = {
      ...generateRandomTestUser(),
      email: `runtime-b-${Date.now()}@playwright.com`,
    };
    const apiKey = `sk-account-${Date.now()}`;
    let runtimeResponseBody = "";

    try {
      await pageA.goto("/register");
      await pageA.getByLabel("Email").fill(userA.email);
      await pageA.getByLabel("Password").fill(userA.password);
      await pageA.getByRole("button", { name: "Sign up" }).click();
      await pageA.waitForURL("**/", { timeout: 10_000 });
      await pageA.route("**/api/models", async (route) => {
        await route.fulfill({
          body: JSON.stringify({
            capabilities: {},
            defaultModelId: "openai/gpt-4.1",
            mode: "embedded",
            models: [
              {
                description: "",
                id: "openai/gpt-4.1",
                name: "GPT 4.1",
                provider: "openai",
              },
            ],
          }),
          contentType: "application/json",
          status: 200,
        });
      });
      pageA.on("response", async (response) => {
        if (
          response.url().includes("/api/runtime-config") &&
          response.request().method() === "POST"
        ) {
          runtimeResponseBody = await response.text();
        }
      });

      await pageA.goto("/api-dashboard");
      await pageA
        .getByLabel("New API base URL")
        .fill("https://account.example");
      await pageA.getByLabel("New API key").fill(apiKey);
      await pageA.getByRole("button", { name: "Save connection" }).click();
      await expect(pageA.getByText("Connection saved.")).toBeVisible();
      await expect(
        pageA.getByText("Connected to https://account.example")
      ).toBeVisible();
      expect(runtimeResponseBody).not.toContain(apiKey);

      await pageB.goto("/register");
      await pageB.getByLabel("Email").fill(userB.email);
      await pageB.getByLabel("Password").fill(userB.password);
      await pageB.getByRole("button", { name: "Sign up" }).click();
      await pageB.waitForURL("**/", { timeout: 10_000 });
      await pageB.goto("/api-dashboard");
      await expect(pageB.getByText("No connection configured")).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
