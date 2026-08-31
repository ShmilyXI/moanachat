import { expect, test } from "@playwright/test";

test.describe("Search page", () => {
  test("renders when history uses the paginated response shape", async ({
    page,
  }) => {
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: "2026-08-29T00:00:00.000Z",
              id: "chat-1",
              title: "Saved chat",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByPlaceholder("Search chats...")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator("main").getByRole("link", { name: "Saved chat" })
    ).toBeVisible({ timeout: 10_000 });
  });
});
