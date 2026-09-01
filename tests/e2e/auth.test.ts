import { expect, test } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Sign in to Moana" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("uses the Venice-style card and supports password visibility", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("moanachat-locale", "en");
    });
    await page.goto("/login");

    await expect(page.locator("[data-auth-shell]")).toHaveAttribute(
      "data-theme",
      "venice-dark"
    );
    await expect(page.locator("[data-auth-panel]")).toBeVisible();
    await expect(page.locator("[data-auth-mark]")).toBeVisible();
    await expect(page.locator(".auth-socials__button")).toHaveCount(5);

    const password = page.getByLabel("Password");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create a Moana account" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("can navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("can navigate from register to login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("can enter Moana without an account", async ({ page }) => {
    await page.goto("/login");
    await page
      .locator("a[href=\"/api/auth/guest?redirectUrl=%2F\"]")
      .evaluate((element) => (element as HTMLAnchorElement).click());
    await expect(page).toHaveURL("/");
  });

  test("shows a visible error after invalid login", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("moanachat-locale", "en");
    });
    await page.goto("/login");
    await page.getByLabel("Email").fill("invalid-login@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("auth-feedback")).toContainText(
      "Invalid credentials!"
    );
  });

  test("follows Chinese browser language on authentication pages", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("moanachat-locale");
      Object.defineProperty(navigator, "language", {
        configurable: true,
        value: "zh-CN",
      });
      Object.defineProperty(navigator, "languages", {
        configurable: true,
        value: ["zh-CN", "zh"],
      });
    });
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "登录 Moana 账户" })
    ).toBeVisible();
    await expect(page.getByLabel("邮箱")).toBeVisible();
    await expect(page.getByLabel("密码")).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
    await expect(page.getByRole("link", { name: "注册" })).toBeVisible();
  });

  test("keeps the Venice-style auth card within narrow viewports", async ({
    page,
  }) => {
    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/register");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth ===
              document.documentElement.clientWidth
          )
        )
        .toBe(true);
      await expect(page.locator("[data-auth-mark]")).toBeVisible();
    }
  });
});
