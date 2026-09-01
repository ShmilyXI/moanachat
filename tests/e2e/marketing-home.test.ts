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
});
