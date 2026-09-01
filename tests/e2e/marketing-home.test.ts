import { expect, test } from "@playwright/test";

test.describe("marketing homepage", () => {
  test("renders the Venice-inspired static homepage", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Ask anything" })
    ).toBeVisible();
    await expect(
      page.locator("header").getByRole("link", { name: "Sign up" })
    ).toHaveAttribute("href", "/sign-up");
    await expect(
      page.getByPlaceholder("Ask anything privately...")
    ).toBeVisible();
  });

  test("enables submit after typing and sends the prompt to agent chat", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByPlaceholder("Ask anything privately...");
    const send = page.getByRole("button", { name: "Send message" });

    await expect(send).toBeDisabled();
    await input.fill("Help me plan a quiet weekend");
    await expect(send).toBeEnabled();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/chat\/agent/);
  });

  test("clicking a prompt preset sends its full prompt to agent chat", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .locator(".marketing-home")
      .getByRole("button", { name: /Write code/ })
      .click();
    await expect(page).toHaveURL(/\/chat\/agent/);
  });

  test("previews a prompt while hovering a preset", async ({ page }) => {
    await page.goto("/");
    await page
      .locator(".marketing-home")
      .getByRole("button", { name: "Write content" })
      .hover();
    await expect(
      page.getByText(
        "I need help writing something. If you need more details about the tone, audience, or format, ask me a couple quick questions first."
      )
    ).toBeVisible();
  });

  test("pauses and resumes the hero video on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const pause = page.getByRole("button", { name: "Pause video" });
    await expect(pause).toBeVisible();
    await pause.click();
    await expect(
      page.getByRole("button", { name: "Play video" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Play video" }).click();
    await expect(
      page.getByRole("button", { name: "Pause video" })
    ).toBeVisible();
  });

  test("morphs into a compact Venice-style navigation after scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const marketingHome = page.locator(".marketing-home");

    await marketingHome.evaluate((element) => {
      element.scrollTo({ top: window.innerHeight, behavior: "instant" });
    });

    const navigation = page.locator("[data-marketing-nav]");
    await expect(navigation).toHaveAttribute("data-state", "scrolled");
    await expect(navigation.locator("[data-mini-composer]")).toBeVisible();
    await expect(navigation.locator("nav")).toBeVisible();
  });

  test("keeps the marketing page within the viewport at supported phone widths", async ({
    page,
  }) => {
    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth ===
              document.documentElement.clientWidth
          )
        )
        .toBe(true);
    }
  });

  test("supports keyboard preview and activation for prompt presets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const preset = page.locator("[data-prompt-preset]").first();

    await preset.focus();
    await expect(
      page.getByText(
        "I need help writing something. If you need more details about the tone, audience, or format, ask me a couple quick questions first."
      )
    ).toBeVisible();
    await preset.press("Enter");
    await expect(page).toHaveURL(/\/chat\/agent/);
  });
});
