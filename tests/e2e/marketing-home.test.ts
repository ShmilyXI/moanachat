import { expect, test } from "@playwright/test";

test.describe("marketing homepage", () => {
  test("renders the Venice-inspired static homepage", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator(".marketing-hero");
    await expect(
      page.getByRole("heading", { name: "Ask anything" })
    ).toBeVisible();
    await expect(
      page.locator("header").getByRole("link", { name: "Sign up" })
    ).toHaveAttribute("href", "/sign-up");
    await expect(
      hero.getByPlaceholder("Ask anything privately...")
    ).toBeVisible();
  });

  test("enables submit after typing and sends the prompt to agent chat", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator(".marketing-hero");
    const input = hero.getByPlaceholder("Ask anything privately...");
    const send = hero.getByRole("button", { name: "Send message" });

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

  test("opens and dismisses desktop navigation dropdowns", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const marketingHome = page.locator(".marketing-home");
    await marketingHome.evaluate((element) => {
      element.scrollTo({ top: window.innerHeight, behavior: "instant" });
    });

    const token = page.getByRole("button", { name: "Token" });
    await expect(token).toHaveAttribute("aria-expanded", "false");
    await token.click();
    await expect(token).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-nav-dropdown]")).toContainText("VVV");

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-nav-dropdown]")).toHaveCount(0);
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

  test("opens and closes the Venice-style mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(
      page.getByRole("button", { name: "Close menu" })
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-mobile-menu]")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-mobile-menu]")).toHaveCount(0);
  });

  test("renders the closing composer and expanded footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".marketing-closing-cta__composer")).toBeVisible();
    await expect(
      page.locator(".marketing-footer__group").filter({ hasText: "Developers" })
    ).toBeVisible();
  });
});
