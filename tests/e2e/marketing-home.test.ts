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

  test("shows a login link in the desktop hero navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const login = page
      .locator(".marketing-header")
      .getByRole("link", { name: "Log in" });
    await expect(login).toHaveCount(1);
    expect(await login.evaluate((element) => getComputedStyle(element).display)).not.toBe(
      "none"
    );
  });

  test("shows only the approved desktop navigation links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const header = page.locator(".marketing-header");
    await page.locator(".marketing-home").evaluate((element) => {
      element.scrollTo({ top: window.innerHeight, behavior: "instant" });
    });

    for (const label of ["About", "Features", "Pricing", "Log in"]) {
      await expect(header.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(header.getByRole("button", { name: "Resources" })).toBeVisible();
    expect(await header.getByRole("button", { name: "Token" }).count()).toBe(0);
    expect(await header.getByRole("link", { name: "Store" }).count()).toBe(0);
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

  test("removes the inner focus outline from the hero composer", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page
      .locator(".marketing-hero")
      .getByPlaceholder("Ask anything privately...");

    await input.focus();
    await expect(input).toHaveCSS("outline-style", "none");
  });

  test("removes the inner focus outline from the compact header composer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator(".marketing-home").evaluate((element) => {
      element.scrollTo({ top: window.innerHeight, behavior: "instant" });
    });

    const input = page.locator("[data-mini-composer] input");
    await expect(input).toBeVisible();
    await input.focus();
    await expect(input).toHaveCSS("outline-style", "none");
  });

  test("hides prompt presets while typing and restores them when cleared", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator(".marketing-hero");
    const input = hero.getByPlaceholder("Ask anything privately...");
    const presets = hero.locator(".marketing-composer__presets");

    await expect(presets).toBeVisible();
    await input.fill("A private weekend plan");
    await expect(presets).toBeHidden();
    await input.fill("");
    await expect(presets).toBeVisible();
  });

  test("keeps the composer in place while typing hides prompt presets", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator(".marketing-hero");
    const input = hero.getByPlaceholder("Ask anything privately...");

    await expect(input).toBeVisible();
    const before = await input.boundingBox();
    await input.fill("A private weekend plan");
    const after = await input.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(0.5);
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

    const resources = page.getByRole("button", { name: "Resources" });
    await expect(resources).toHaveAttribute("aria-expanded", "false");
    await resources.click();
    await expect(resources).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-nav-dropdown]")).toContainText("API + Docs");

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-nav-dropdown]")).toHaveCount(0);
  });

  test("enters the compact header from above after scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator(".marketing-home").evaluate((element) => {
      element.scrollTo({ top: window.innerHeight, behavior: "instant" });
    });

    const navigation = page.locator("[data-marketing-nav]");
    await expect(navigation).toHaveAttribute("data-state", "scrolled");
    expect(
      await navigation.evaluate((element) => getComputedStyle(element).animationName)
    ).toBe("marketing-header-drop-in");
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

  test("uses custom controls for the audio capability demo", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.resolve();
      HTMLMediaElement.prototype.pause = () => undefined;
    });
    await page.goto("/");

    const audioCard = page
      .locator(".marketing-capability-card")
      .filter({ hasText: "Audio & Music" });
    const audio = audioCard.locator("audio");
    await expect(audio).toHaveCount(1);
    expect(await audio.getAttribute("controls")).toBeNull();

    const play = audioCard.getByRole("button", { name: "Play track" });
    await expect(play).toBeVisible();
    await play.click();
    await expect(audioCard.getByRole("button", { name: "Pause track" })).toBeVisible();
  });
});
