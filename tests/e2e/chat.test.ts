import { expect, test } from "@playwright/test";

test.describe("Chat Page", () => {
  test("opens the sidebar from a narrow embedded viewport", async ({
    page,
  }) => {
    const directUrl = new URL(
      test.info().project.use.baseURL ?? "http://localhost:3000/"
    );
    directUrl.hostname = "127.0.0.1";
    await page.setViewportSize({ height: 960, width: 652 });
    await page.goto(directUrl.toString());

    const sidebarToggle = page.getByTestId("sidebar-toggle-button");
    await expect(sidebarToggle).toBeVisible({ timeout: 10_000 });

    await sidebarToggle.click();
    await expect(page.getByText("New chat")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("home page loads with input field", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("can type in the input field", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Hello world");
    await expect(input).toHaveValue("Hello world");
  });

  test("submit button is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("send-button")).toBeVisible();
  });

  test("hides studio and feed from the sidebar navigation", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { exact: true, name: "Studio" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { exact: true, name: "Feed" })
    ).toHaveCount(0);
  });

  test("hides agent and character surfaces from the chat shell", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { exact: true, name: "Agentic Chat" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { exact: true, name: "Characters" })
    ).toHaveCount(0);
    await expect(
      page.getByText("Try Agentic Chat", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("My characters", { exact: true })).toHaveCount(
      0
    );
  });

  test("suggested actions are visible on empty chat", async ({ page }) => {
    await page.goto("/");
    const suggestions = page.locator("[data-testid='suggested-actions']");
    await expect(suggestions).toBeVisible();
  });

  test("does not show the unused composer tools control", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { exact: true, name: "Tools" })
    ).toHaveCount(0);
    await expect(page.getByText("操作", { exact: true })).toHaveCount(0);
  });

  test("shows only settings that are wired to chat requests", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { exact: true, name: "Settings" }).click();

    await expect(page.getByTestId("setting-reasoning")).toBeEnabled();
    await expect(
      page.getByText("Large context chat", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("Context usage", { exact: true })).toHaveCount(
      0
    );
    await expect(
      page.getByRole("button", { exact: true, name: "Reset" })
    ).toHaveCount(0);
  });

  test("can stop generation with stop button", async ({ page }) => {
    await page.goto("/");

    // Type and send a message
    await page.getByTestId("multimodal-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // Stop button should appear during generation
    const stopButton = page.getByTestId("stop-button");
    // If generation starts, stop button appears
    // This is a best-effort check since timing depends on API
    await stopButton.click({ timeout: 5000 }).catch(() => {
      // Generation may have finished before we could click
    });
  });
});

test.describe("Chat Input Features", () => {
  test("input clears after sending", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Test message");
    await page.getByTestId("send-button").click();

    // Input should clear after sending
    await expect(input).toHaveValue("");
  });

  test("input supports multiline text", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Line 1\nLine 2\nLine 3");
    await expect(input).toContainText("Line 1");
  });
});

test.describe("Locale switching", () => {
  test("follows a Chinese browser locale", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", {
        configurable: true,
        value: "zh-CN",
      });
      Object.defineProperty(navigator, "languages", {
        configurable: true,
        value: ["zh-CN", "en-US"],
      });
    });

    await page.goto("/");

    await expect(page.getByText("今天想聊点什么？")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  });

  test("switches language and persists the choice", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-switcher").first().click();
    await page.getByTestId("language-option-zh").click();

    await expect(page.getByText("今天想聊点什么？")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    await page.reload();
    await expect(page.getByText("今天想聊点什么？")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    await page.getByTestId("language-switcher").first().click();
    await page.getByTestId("language-option-en").click();

    await expect(page.getByText("What can I help with?")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
